import { OpenStreetMapProvider } from "./openStreetMapProvider.js";
import { NoopGeocodingProvider } from "./noopGeocodingProvider.js";
import { NominatimGeocodingProvider } from "./nominatimGeocodingProvider.js";

export function createMapLinkProvider() {
  const provider = (process.env.MAP_LINK_PROVIDER || "openstreetmap").toLowerCase();

  switch (provider) {
    case "openstreetmap":
    default:
      return new OpenStreetMapProvider();
  }
}

export function createGeocodingProvider() {
  const provider = (process.env.GEOCODING_PROVIDER || "noop").toLowerCase();

  switch (provider) {
    case "nominatim":
      return new NominatimGeocodingProvider({
        baseUrl: process.env.NOMINATIM_BASE_URL,
        userAgent: process.env.NOMINATIM_USER_AGENT || "YNA_Chat/1.0",
      });
    case "noop":
    default:
      return new NoopGeocodingProvider();
  }
}
