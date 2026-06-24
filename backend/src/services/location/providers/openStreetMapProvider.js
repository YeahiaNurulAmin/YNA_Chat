function latLonToTile(latitude, longitude, zoom) {
  const scale = 2 ** zoom;
  const x = Math.floor(((longitude + 180) / 360) * scale);
  const latRad = (latitude * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * scale,
  );
  return { x, y, zoom };
}

/** OpenStreetMap map links and tile URLs — swap provider via MAP_LINK_PROVIDER env. */
export class OpenStreetMapProvider {
  get name() {
    return "openstreetmap";
  }

  getMapUrl(latitude, longitude, zoom = 16) {
    const lat = Number(latitude);
    const lng = Number(longitude);
    return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=${zoom}/${lat}/${lng}`;
  }

  getStaticMapImageUrl(latitude, longitude, zoom = 15) {
    const lat = Number(latitude);
    const lng = Number(longitude);
    const { x, y } = latLonToTile(lat, lng, zoom);
    return `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
  }

  getTileLayerConfig() {
    return {
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    };
  }
}
