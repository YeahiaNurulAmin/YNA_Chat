/** OpenStreetMap Nominatim reverse geocoding (rate-limited; use responsibly). */
export class NominatimGeocodingProvider {
  constructor({ baseUrl = "https://nominatim.openstreetmap.org", userAgent = "YNA_Chat/1.0" } = {}) {
    this.baseUrl = baseUrl;
    this.userAgent = userAgent;
  }

  get name() {
    return "nominatim";
  }

  async reverseGeocode(latitude, longitude) {
    const url = new URL("/reverse", this.baseUrl);
    url.searchParams.set("format", "json");
    url.searchParams.set("lat", String(latitude));
    url.searchParams.set("lon", String(longitude));
    url.searchParams.set("zoom", "18");
    url.searchParams.set("addressdetails", "0");

    const response = await fetch(url, {
      headers: { "User-Agent": this.userAgent },
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (!data?.display_name) return null;

    return { label: data.display_name };
  }
}
