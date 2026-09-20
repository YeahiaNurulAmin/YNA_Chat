/**
 * Centralized outbound-proxy support.
 *
 * Why this exists
 * ---------------
 * On restricted networks the machine can only reach the internet through an
 * HTTP proxy (`HTTP_PROXY` / `HTTPS_PROXY`). Different clients need different
 * wiring, so this module centralizes all of it:
 *
 *  1. `fetch()` based SDKs (Clerk, ImageKit, LiveKit, Nominatim, cron ping)
 *     are covered by `installFetchProxy()`, which installs an undici proxy
 *     dispatcher on the global dispatcher that Node's built-in `fetch` uses.
 *
 *  2. The MongoDB driver speaks raw TCP/TLS and ignores proxy env vars. It
 *     only supports SOCKS5 (`proxyHost` / `proxyPort`). When the configured
 *     proxy is an HTTP proxy we start a small loopback-only SOCKS5 server that
 *     tunnels every connection through the upstream HTTP `CONNECT` method.
 *
 *  3. `mongodb+srv://` requires an SRV/TXT DNS lookup. Node's c-ares resolver
 *     is often unusable on such networks, so we resolve the seedlist over
 *     DNS-over-HTTPS (which rides on the already-proxied `fetch`).
 *
 * Everything is opt-in: with no proxy env vars set, `MONGODB_URI` is returned
 * untouched and the app behaves exactly as before.
 */

import net from "node:net";
import { EnvHttpProxyAgent, ProxyAgent, setGlobalDispatcher } from "undici";

const DEFAULT_BRIDGE_PORT = 10808;
const DEFAULT_DOH_URL = "https://dns.google/resolve";
const DEFAULT_NO_PROXY = "localhost,127.0.0.1,::1";

let fetchProxyInstalled = false;

/** Upstream proxy URL from `PROXY_URL` / `HTTPS_PROXY` / `HTTP_PROXY`. */
export function getProxyUrl() {
  const raw =
    process.env.PROXY_URL ||
    process.env.HTTPS_PROXY ||
    process.env.https_proxy ||
    process.env.HTTP_PROXY ||
    process.env.http_proxy ||
    "";

  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Tolerate values written without a scheme, e.g. "192.168.43.114:8080".
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
}

/**
 * @returns {null | { protocol: string, host: string, port: number, username?: string, password?: string }}
 */
export function parseProxyUrl(proxyUrl = getProxyUrl()) {
  if (!proxyUrl) return null;

  let url;
  try {
    url = new URL(proxyUrl);
  } catch {
    console.warn(`[proxy] Ignoring unparsable proxy URL: ${proxyUrl}`);
    return null;
  }

  const protocol = url.protocol.toLowerCase();
  const defaultPort =
    protocol === "https:" ? 443 : protocol.startsWith("socks") ? 1080 : 80;

  const parsed = {
    protocol,
    host: url.hostname,
    port: Number(url.port) || defaultPort,
  };

  if (url.username) parsed.username = decodeURIComponent(url.username);
  if (url.password) parsed.password = decodeURIComponent(url.password);

  return parsed;
}

export function isProxyConfigured() {
  return Boolean(parseProxyUrl());
}

/** A SOCKS proxy can be handed straight to the MongoDB driver. */
export function isSocksProxy(proxy) {
  return Boolean(proxy) && (proxy.protocol === "socks5:" || proxy.protocol === "socks4:");
}

function upstreamAuthHeader(proxy) {
  if (!proxy.username) return "";
  const token = Buffer.from(`${proxy.username}:${proxy.password ?? ""}`).toString("base64");
  return `Proxy-Authorization: Basic ${token}\r\n`;
}

function formatIpv6(buffer, offset) {
  const segments = [];
  for (let i = 0; i < 16; i += 2) {
    segments.push(buffer.readUInt16BE(offset + i).toString(16));
  }
  return segments.join(":");
}

/** SOCKS5 reply codes (RFC 1928). */
const SOCKS_ERROR = {
  GENERAL_FAILURE: 0x01,
  HOST_UNREACHABLE: 0x04,
  CONNECTION_REFUSED: 0x05,
  COMMAND_NOT_SUPPORTED: 0x07,
  ADDRESS_TYPE_NOT_SUPPORTED: 0x08,
};

function socksReply(errorCode, addressType = 0x01) {
  // VER, REP, RSV, ATYP, BND.ADDR, BND.PORT
  return Buffer.from([0x05, errorCode, 0x00, addressType, 0, 0, 0, 0, 0, 0]);
}

/* ------------------------------------------------------------------ *
 * Local SOCKS5 -> upstream HTTP CONNECT bridge
 * ------------------------------------------------------------------ */

/**
 * Dials the upstream HTTP proxy and issues a CONNECT for `host:port`.
 * Resolves once the tunnel is established, handing back the socket plus any
 * bytes the proxy sent after the response headers.
 */
function openUpstreamTunnel(proxy, host, port, timeoutMs) {
  return new Promise((resolve, reject) => {
    const socket = net.connect({ host: proxy.host, port: proxy.port });
    socket.setNoDelay(true);

    let settled = false;
    let buffer = Buffer.alloc(0);

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      socket.destroy();
      reject(new Error(`Upstream proxy ${proxy.host}:${proxy.port} timed out`));
    }, timeoutMs);

    const fail = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      socket.destroy();
      reject(error);
    };

    socket.on("error", (error) => fail(error));

    socket.on("connect", () => {
      socket.write(
        `CONNECT ${host}:${port} HTTP/1.1\r\n` +
          `Host: ${host}:${port}\r\n` +
          upstreamAuthHeader(proxy) +
          "Proxy-Connection: Keep-Alive\r\n\r\n",
      );
    });

    socket.on("data", (chunk) => {
      if (settled) return;

      buffer = Buffer.concat([buffer, chunk]);
      const headerEnd = buffer.indexOf("\r\n\r\n");
      if (headerEnd === -1) return;

      const head = buffer.subarray(0, headerEnd).toString("latin1");
      const status = Number(head.split("\r\n")[0].split(/\s+/)[1]);

      if (status !== 200) {
        fail(new Error(`Upstream proxy refused CONNECT to ${host}:${port} (HTTP ${status})`));
        return;
      }

      settled = true;
      clearTimeout(timer);
      socket.removeAllListeners("data");
      resolve({ socket, remainder: buffer.subarray(headerEnd + 4) });
    });
  });
}

function handleSocksClient(client, upstream, connectTimeoutMs) {
  client.setNoDelay(true);

  let buffer = Buffer.alloc(0);
  let stage = "greeting";

  const onData = (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);

    if (stage === "greeting") {
      if (buffer.length < 2) return;
      if (buffer[0] !== 0x05) return client.destroy();

      const methodCount = buffer[1];
      if (buffer.length < 2 + methodCount) return;

      buffer = buffer.subarray(2 + methodCount);
      // The listener is loopback-only, so "no authentication" is safe here.
      client.write(Buffer.from([0x05, 0x00]));
      stage = "request";
    }

    if (stage !== "request") return;
    if (buffer.length < 4) return;

    const command = buffer[1];
    const addressType = buffer[3];
    let host;
    let portOffset;

    if (addressType === 0x01) {
      if (buffer.length < 10) return;
      host = `${buffer[4]}.${buffer[5]}.${buffer[6]}.${buffer[7]}`;
      portOffset = 8;
    } else if (addressType === 0x03) {
      if (buffer.length < 5) return;
      const length = buffer[4];
      if (buffer.length < 5 + length + 2) return;
      host = buffer.subarray(5, 5 + length).toString("utf8");
      portOffset = 5 + length;
    } else if (addressType === 0x04) {
      if (buffer.length < 22) return;
      host = formatIpv6(buffer, 4);
      portOffset = 20;
    } else {
      client.end(socksReply(SOCKS_ERROR.ADDRESS_TYPE_NOT_SUPPORTED));
      return;
    }

    const port = buffer.readUInt16BE(portOffset);
    const leftover = buffer.subarray(portOffset + 2);

    if (command !== 0x01) {
      // Only CONNECT is implemented; BIND / UDP ASSOCIATE are not needed.
      client.end(socksReply(SOCKS_ERROR.COMMAND_NOT_SUPPORTED));
      return;
    }

    stage = "tunnelling";
    client.removeListener("data", onData);

    openUpstreamTunnel(upstream, host, port, connectTimeoutMs)
      .then(({ socket, remainder }) => {
        if (client.destroyed) {
          socket.destroy();
          return;
        }

        // Tunnel is up: acknowledge, then splice both directions together.
        client.write(socksReply(0x00));

        if (remainder.length) socket.write(remainder);
        if (leftover.length) socket.write(leftover);

        socket.pipe(client);
        client.pipe(socket);

        client.on("error", () => socket.destroy());
        socket.on("error", () => client.destroy());
        client.on("close", () => socket.destroy());
        socket.on("close", () => client.destroy());
      })
      .catch((error) => {
        console.warn(`[proxy] tunnel ${host}:${port} failed: ${error.message}`);
        client.end(
          socksReply(
            /refused CONNECT/.test(error.message)
              ? SOCKS_ERROR.CONNECTION_REFUSED
              : SOCKS_ERROR.GENERAL_FAILURE,
          ),
        );
      });
  };

  client.on("data", onData);
  client.on("error", () => client.destroy());
}

/**
 * Starts a loopback SOCKS5 server that forwards every connection through the
 * upstream HTTP proxy. Returns the local address plus a `close()` handle.
 */
export function startSocksBridge(proxy) {
  const preferredPort = Number(process.env.MONGODB_PROXY_PORT) || DEFAULT_BRIDGE_PORT;
  const host = process.env.MONGODB_PROXY_HOST || "127.0.0.1";
  const connectTimeoutMs = Number(process.env.MONGODB_PROXY_TIMEOUT_MS) || 30000;

  const listen = (port) =>
    new Promise((resolve, reject) => {
      const server = net.createServer((client) =>
        handleSocksClient(client, proxy, connectTimeoutMs),
      );

      server.on("error", (error) => {
        server.removeAllListeners();
        reject(error);
      });

      server.listen(port, host, () => {
        const boundPort = server.address().port;
        console.log(
          `[proxy] SOCKS5 bridge listening on ${host}:${boundPort} -> ${proxy.host}:${proxy.port}`,
        );

        // The bridge only exists to serve the app, so it must never be the
        // reason the process stays alive (matters for CLI scripts such as
        // `npm run check:connections`, or a graceful shutdown).
        server.unref();

        resolve({
          host,
          port: boundPort,
          close: () => new Promise((done) => server.close(() => done())),
        });
      });
    });

  return listen(preferredPort).catch((error) => {
    // Another process (for example a second `npm run dev`) may already own the
    // port; falling back to an ephemeral port keeps the driver working without
    // any manual conflict handling.
    if (error.code !== "EADDRINUSE") throw error;

    console.warn(`[proxy] Port ${preferredPort} is busy — using an ephemeral port instead.`);
    return listen(0);
  });
}

let bridgePromise = null;

/** Starts (once) the SOCKS5 bridge for the currently configured HTTP proxy. */
export function ensureSocksBridge(proxy) {
  if (!bridgePromise) {
    bridgePromise = startSocksBridge(proxy).catch((error) => {
      bridgePromise = null;
      throw error;
    });
  }
  return bridgePromise;
}

/* ------------------------------------------------------------------ *
 * DNS-over-HTTPS seedlist resolution for mongodb+srv://
 * ------------------------------------------------------------------ */

async function dohQuery(name, type) {
  const url = new URL(process.env.MONGODB_DOH_URL || DEFAULT_DOH_URL);
  url.searchParams.set("name", name);
  url.searchParams.set("type", type);

  const response = await fetch(url, {
    headers: { accept: "application/dns-json" },
    signal: AbortSignal.timeout(Number(process.env.MONGODB_DOH_TIMEOUT_MS) || 10000),
  });

  if (!response.ok) {
    throw new Error(`DoH ${type} lookup for ${name} failed with HTTP ${response.status}`);
  }

  const data = await response.json();
  if (data.Status !== 0) {
    throw new Error(`DoH ${type} lookup for ${name} returned DNS status ${data.Status}`);
  }

  return data.Answer ?? [];
}

/** Splits `mongodb+srv://user:pass@host/db?opts` into its pieces. */
function splitSrvUri(uri) {
  const withoutScheme = uri.slice("mongodb+srv://".length);
  const slashIndex = withoutScheme.indexOf("/");
  const authority = slashIndex === -1 ? withoutScheme : withoutScheme.slice(0, slashIndex);
  const rest = slashIndex === -1 ? "" : withoutScheme.slice(slashIndex);

  const atIndex = authority.lastIndexOf("@");
  const userInfo = atIndex === -1 ? "" : authority.slice(0, atIndex + 1);
  const hostname = atIndex === -1 ? authority : authority.slice(atIndex + 1);

  const [path = "", search = ""] = rest.slice(1).split("?");
  return { userInfo, hostname, path, search };
}

function toSearchParams(rawOptions) {
  const params = new URLSearchParams();
  for (const pair of rawOptions.split("&")) {
    if (!pair) continue;
    const separator = pair.indexOf("=");
    if (separator === -1) {
      params.set(pair, "");
      continue;
    }
    params.set(pair.slice(0, separator), pair.slice(separator + 1));
  }
  return params;
}

/**
 * Converts a `mongodb+srv://` URI into an equivalent seedlist URI by resolving
 * SRV/TXT records over DoH. This is required because the OS/c-ares resolver is
 * frequently unable to answer SRV queries on proxied networks.
 */
export async function resolveSrvUriViaDoh(uri) {
  const { userInfo, hostname, path, search } = splitSrvUri(uri);

  const srvRecords = await dohQuery(`_mongodb._tcp.${hostname}`, "SRV");
  const hosts = srvRecords
    .map((record) => /(\d+)\s+(\S+?)\.?$/.exec(String(record.data)))
    .filter(Boolean)
    .map((match) => `${match[2]}:${match[1]}`);

  if (!hosts.length) {
    throw new Error(`No SRV records found for _mongodb._tcp.${hostname}`);
  }

  // The TXT record carries Atlas defaults such as authSource and replicaSet.
  let txtOptions = "";
  try {
    const txtRecords = await dohQuery(hostname, "TXT");
    txtOptions = txtRecords
      .map((record) => String(record.data).replace(/^"|"$/g, ""))
      .join("&");
  } catch (error) {
    console.warn(`[proxy] DoH TXT lookup failed (continuing): ${error.message}`);
  }

  // TXT defaults first, then anything explicitly present in the original URI.
  const params = toSearchParams(txtOptions);
  for (const [key, value] of toSearchParams(search)) {
    params.set(key, value);
  }

  // `mongodb+srv://` implies TLS; a seedlist URI needs it stated explicitly.
  if (!params.has("tls") && !params.has("ssl")) {
    params.set("tls", "true");
  }

  const query = params.toString();
  return `mongodb://${userInfo}${hosts.join(",")}/${path}${query ? `?${query}` : ""}`;
}

/* ------------------------------------------------------------------ *
 * Public entry point used by lib/db.js
 * ------------------------------------------------------------------ */

/**
 * Routes every global `fetch()` call (Clerk, ImageKit, LiveKit, Nominatim,
 * the keep-alive cron) through the configured proxy.
 *
 * Node's built-in `fetch` is undici, and shipped undici reads its dispatcher
 * from the same global slot as the `undici` package. Installing a dispatcher
 * here therefore covers the SDKs without any per-client configuration, and
 * works on any supported Node version (no CLI flag required).
 *
 * Must be called after `dotenv` has populated `process.env` and before the
 * first outbound request.
 */
export function installFetchProxy() {
  if (fetchProxyInstalled) return true;

  const proxyUrl = getProxyUrl();
  if (!proxyUrl) return false;

  const proxy = parseProxyUrl(proxyUrl);
  if (!proxy) return false;

  if (isSocksProxy(proxy)) {
    // undici has no SOCKS transport; the MongoDB driver is handled separately.
    console.warn(
      `[proxy] ${proxy.protocol} is not supported for fetch-based clients ` +
        "(Clerk, ImageKit, LiveKit). Point HTTP_PROXY/HTTPS_PROXY at an HTTP proxy, " +
        "or leave PROXY_URL unset to use direct connections for those services.",
    );
    return false;
  }

  const options = { httpProxy: proxyUrl, httpsProxy: proxyUrl };
  const noProxy = process.env.NO_PROXY || process.env.no_proxy;

  try {
    setGlobalDispatcher(
      noProxy === undefined
        ? new EnvHttpProxyAgent({ ...options, noProxy: DEFAULT_NO_PROXY })
        : new EnvHttpProxyAgent({ ...options, noProxy }),
    );
  } catch (error) {
    // Older undici builds may not export EnvHttpProxyAgent options; ProxyAgent
    // still covers the common "everything goes through the proxy" case.
    console.warn(`[proxy] Falling back to undici ProxyAgent: ${error.message}`);
    setGlobalDispatcher(new ProxyAgent(proxyUrl));
  }

  fetchProxyInstalled = true;
  console.log(`[proxy] fetch/undici routed through ${proxy.host}:${proxy.port}`);
  return true;
}

/**
 * Rewrites `MONGODB_URI` when needed and returns the mongoose connection
 * options that route traffic through the configured proxy.
 *
 * @returns {Promise<{ uri: string, options: object, proxied: boolean }>}
 */
export async function prepareMongoConnection(uri = process.env.MONGODB_URI) {
  const proxy = parseProxyUrl();

  if (!proxy) {
    return { uri, options: {}, proxied: false };
  }

  let resolvedUri = uri;

  if (uri.startsWith("mongodb+srv://") && process.env.MONGODB_SKIP_DOH !== "1") {
    try {
      resolvedUri = await resolveSrvUriViaDoh(uri);
      const redacted = resolvedUri.replace(/\/\/([^@/]+)@/, "//***@");
      console.log("[proxy] Resolved mongodb+srv seedlist over DNS-over-HTTPS:");
      console.log(`[proxy]   ${redacted}`);
    } catch (error) {
      throw new Error(
        `Unable to resolve the MongoDB seedlist over DoH (${error.message}). ` +
          "Set MONGODB_URI to a plain mongodb:// seedlist to bypass SRV resolution.",
      );
    }
  }

  // A SOCKS proxy can be handed straight to the driver.
  if (isSocksProxy(proxy)) {
    const options = { proxyHost: proxy.host, proxyPort: proxy.port };
    if (proxy.username) {
      options.proxyUsername = proxy.username;
      options.proxyPassword = proxy.password ?? "";
    }
    console.log(`[proxy] MongoDB using the upstream SOCKS proxy ${proxy.host}:${proxy.port}`);
    return { uri: resolvedUri, options, proxied: true };
  }

  // HTTP/HTTPS proxy: the driver cannot speak it, so bridge SOCKS5 -> CONNECT.
  const bridge = await ensureSocksBridge(proxy);
  console.log("[proxy] MongoDB tunnelling through the local SOCKS5 bridge");
  return {
    uri: resolvedUri,
    options: { proxyHost: bridge.host, proxyPort: bridge.port },
    proxied: true,
  };
}

/** Human-readable one-liner used at boot for diagnostics. */
export function describeProxySetup() {
  const proxy = parseProxyUrl();
  if (!proxy) return "[proxy] No outbound proxy configured (using direct connections).";

  const auth = proxy.username ? " (with credentials)" : "";
  const fetchState = fetchProxyInstalled ? "proxied" : "direct";

  return `[proxy] Upstream ${proxy.protocol}//${proxy.host}:${proxy.port}${auth} — fetch/undici: ${fetchState}`;
}
