/**
 * Example template for a Google Maps provider.
 * Set MAP_LINK_PROVIDER=google and implement env GOOGLE_MAPS_API_KEY.
 *
 * export class GoogleMapsProvider {
 *   get name() { return "google"; }
 *   getMapUrl(lat, lng) {
 *     return `https://www.google.com/maps?q=${lat},${lng}`;
 *   }
 *   getStaticMapImageUrl(lat, lng, zoom = 15) {
 *     const key = process.env.GOOGLE_MAPS_API_KEY;
 *     return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=280x140&markers=${lat},${lng}&key=${key}`;
 *   }
 *   getTileLayerConfig() {
 *     throw new Error("Use Google Maps SDK on mobile clients; tileLayer not provided.");
 *   }
 * }
 */

export {};
