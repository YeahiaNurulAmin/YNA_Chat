/** No-op geocoding — replace via GEOCODING_PROVIDER for Nominatim, Google, etc. */
export class NoopGeocodingProvider {
  get name() {
    return "noop";
  }

  async reverseGeocode() {
    return null;
  }
}
