import { randomUUID } from "crypto";
import Message from "../../models/Message.js";
import LiveLocationSession from "../../models/LiveLocationSession.js";
import User from "../../models/User.js";
import { deliverMessage } from "../../lib/deliverMessage.js";
import {
  LOCATION_LIMITS,
  parseIntervalMs,
  parseLocation,
  distanceMeters,
} from "../../lib/location/parseLocation.js";
import { createGeocodingProvider, createMapLinkProvider } from "./providers/index.js";

export class LocationService {
  constructor({ mapProvider, geocodingProvider } = {}) {
    this.mapProvider = mapProvider ?? createMapLinkProvider();
    this.geocodingProvider = geocodingProvider ?? createGeocodingProvider();
  }

  getClientConfig() {
    const tileLayer = this.mapProvider.getTileLayerConfig();

    return {
      mapProvider: this.mapProvider.name,
      geocodingProvider: this.geocodingProvider.name,
      tileLayer,
      limits: { ...LOCATION_LIMITS },
      frequencyPresets: [
        { label: "1s", ms: 1000 },
        { label: "5s", ms: 5000 },
        { label: "15s", ms: 15000 },
        { label: "30s", ms: 30000 },
        { label: "1 min", ms: 60_000 },
        { label: "5 min", ms: 300_000 },
        { label: "15 min", ms: 900_000 },
        { label: "1 hr", ms: 3_600_000 },
      ],
    };
  }

  enrichLocationLinks(location) {
    if (location?.latitude == null || location?.longitude == null) return location;

    return {
      ...location,
      mapUrl: this.mapProvider.getMapUrl(location.latitude, location.longitude),
      staticMapUrl: this.mapProvider.getStaticMapImageUrl(
        location.latitude,
        location.longitude,
      ),
    };
  }

  async resolveReceiver(receiverId) {
    const receiver = await User.findById(receiverId).select("_id");
    if (!receiver) return { error: "Receiver not found", status: 404 };
    return { receiver };
  }

  async sendStaticLocation({ senderId, receiverId, rawLocation }) {
    const receiverResult = await this.resolveReceiver(receiverId);
    if (receiverResult.error) return receiverResult;

    const locationResult = parseLocation(rawLocation);
    if (locationResult.error) return { error: locationResult.error, status: 400 };
    if (!locationResult.location) {
      return { error: "Location is required", status: 400 };
    }

    const geocoded = await this.geocodingProvider.reverseGeocode(
      locationResult.location.latitude,
      locationResult.location.longitude,
    );

    const location = {
      ...locationResult.location,
      ...(geocoded?.label ? { label: geocoded.label } : {}),
    };

    const message = new Message({
      senderId,
      receiverId,
      location,
      isLiveLocation: false,
    });

    const saved = await deliverMessage(message, receiverId);

    return {
      message: saved,
      location: this.enrichLocationLinks(location),
    };
  }

  async getActiveSession(senderId) {
    return LiveLocationSession.findOne({ senderId, status: "active" }).sort({ startedAt: -1 });
  }

  async startLiveSession({ senderId, receiverId, intervalMs: rawIntervalMs }) {
    const receiverResult = await this.resolveReceiver(receiverId);
    if (receiverResult.error) return receiverResult;

    const intervalResult = parseIntervalMs(rawIntervalMs);
    if (intervalResult.error) return { error: intervalResult.error, status: 400 };

    await LiveLocationSession.updateMany(
      { senderId, status: "active" },
      { status: "stopped", stoppedAt: new Date() },
    );

    const session = await LiveLocationSession.create({
      sessionId: randomUUID(),
      senderId,
      receiverId,
      intervalMs: intervalResult.intervalMs,
      status: "active",
      startedAt: new Date(),
    });

    return { session };
  }

  async pingLiveSession({ senderId, sessionId, rawLocation, force = false }) {
    const session = await LiveLocationSession.findOne({ sessionId, senderId, status: "active" });
    if (!session) {
      return { error: "Live location session not found or inactive", status: 404 };
    }

    const locationResult = parseLocation(rawLocation);
    if (locationResult.error) return { error: locationResult.error, status: 400 };
    if (!locationResult.location) {
      return { error: "Location is required for live ping", status: 400 };
    }

    const now = Date.now();
    const minGap = Math.max(session.intervalMs, LOCATION_LIMITS.MIN_PING_INTERVAL_MS);

    if (!force && session.lastPingAt && now - session.lastPingAt.getTime() < minGap) {
      return { error: "Live location updates are too frequent", status: 429 };
    }

    if (
      !force &&
      session.lastLocation?.latitude != null &&
      distanceMeters(
        session.lastLocation.latitude,
        session.lastLocation.longitude,
        locationResult.location.latitude,
        locationResult.location.longitude,
      ) < LOCATION_LIMITS.DEDUPE_METERS
    ) {
      return { skipped: true, session };
    }

    const message = new Message({
      senderId,
      receiverId: session.receiverId,
      location: locationResult.location,
      isLiveLocation: true,
      liveSessionId: session.sessionId,
    });

    const saved = await deliverMessage(message, session.receiverId);

    session.lastPingAt = new Date();
    session.lastLocation = locationResult.location;
    session.pingCount += 1;
    await session.save();

    return {
      message: saved,
      session,
      location: this.enrichLocationLinks(locationResult.location),
    };
  }

  async stopLiveSession({ senderId, sessionId, sendEndMessage = true }) {
    const session = await LiveLocationSession.findOne({ sessionId, senderId, status: "active" });
    if (!session) {
      return { error: "Live location session not found or already stopped", status: 404 };
    }

    session.status = "stopped";
    session.stoppedAt = new Date();
    await session.save();

    let endMessage = null;
    if (sendEndMessage) {
      endMessage = new Message({
        senderId,
        receiverId: session.receiverId,
        text: "Live location sharing ended",
        isLiveLocation: false,
        liveSessionId: session.sessionId,
      });
      endMessage = await deliverMessage(endMessage, session.receiverId);
    }

    return { session, endMessage };
  }
}

let locationServiceInstance;

export function getLocationService() {
  if (!locationServiceInstance) {
    locationServiceInstance = new LocationService();
  }
  return locationServiceInstance;
}

export function resetLocationServiceForTests(instance) {
  locationServiceInstance = instance;
}
