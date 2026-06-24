import { Button, Modal, useOverlayState } from "@heroui/react";
import L from "leaflet";
import { CrosshairIcon, LoaderIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import "leaflet/dist/leaflet.css";
import { fetchLocationConfig } from "../../lib/locationApi";
import {
  formatCoordinates,
  getCurrentLocation,
  getCurrentLocationWithRetry,
  isGeolocationSupported,
} from "../../lib/location";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const DEFAULT_CENTER = { latitude: 24.4539, longitude: 54.3773 };

export function LocationPickerModal({ isOpen, onOpenChange, onSend, isSending = false }) {
  const modal = useOverlayState({ isOpen, onOpenChange });
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  const [selectedCoords, setSelectedCoords] = useState(null);
  const [selectedAccuracy, setSelectedAccuracy] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isSendingLocal, setIsSendingLocal] = useState(false);

  const isBusy = isSending || isSendingLocal || isLocating;

  const applyMarkerPosition = (latitude, longitude, accuracy = null) => {
    if (markerRef.current) {
      markerRef.current.setLatLng([latitude, longitude]);
    }
    if (mapRef.current) {
      mapRef.current.setView([latitude, longitude], mapRef.current.getZoom());
    }
    setSelectedCoords({ latitude, longitude });
    setSelectedAccuracy(accuracy);
  };

  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return undefined;

    let cancelled = false;

    const initMap = async () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }

      const config = await fetchLocationConfig();
      if (cancelled || !mapContainerRef.current) return;

      const tileLayer = config?.tileLayer ?? {
        url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      };

      const initial = selectedCoords ?? DEFAULT_CENTER;
      const map = L.map(mapContainerRef.current, {
        center: [initial.latitude, initial.longitude],
        zoom: 14,
      });

      L.tileLayer(tileLayer.url, {
        attribution: tileLayer.attribution,
        maxZoom: tileLayer.maxZoom ?? 19,
      }).addTo(map);

      const marker = L.marker([initial.latitude, initial.longitude], { draggable: true }).addTo(
        map,
      );

      const syncCoords = (latlng) => {
        setSelectedCoords({ latitude: latlng.lat, longitude: latlng.lng });
        setSelectedAccuracy(null);
      };

      marker.on("dragend", () => syncCoords(marker.getLatLng()));
      map.on("click", (event) => {
        marker.setLatLng(event.latlng);
        syncCoords(event.latlng);
      });

      mapRef.current = map;
      markerRef.current = marker;
      setSelectedCoords({ latitude: initial.latitude, longitude: initial.longitude });

      setTimeout(() => map.invalidateSize(), 250);
      setTimeout(() => map.invalidateSize(), 600);
    };

    void initMap();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-init map only when modal opens
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedCoords(null);
      setSelectedAccuracy(null);
      setIsLocating(false);
      setIsSendingLocal(false);
      return undefined;
    }

    let cancelled = false;

    const centerOnCurrentLocation = async () => {
      if (!isGeolocationSupported()) return;

      setIsLocating(true);
      try {
        const location = await getCurrentLocation({ silent: true, timeout: 10000 });
        if (cancelled) return;
        applyMarkerPosition(location.latitude, location.longitude, location.accuracy);
        mapRef.current?.setView([location.latitude, location.longitude], 16);
      } catch {
        if (!cancelled && !selectedCoords) {
          setSelectedCoords(DEFAULT_CENTER);
        }
      } finally {
        if (!cancelled) setIsLocating(false);
      }
    };

    void centerOnCurrentLocation();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per open
  }, [isOpen]);

  const handleUseCurrentLocation = async () => {
    if (!isGeolocationSupported()) {
      toast.error("Geolocation is not supported in this browser.");
      return;
    }

    setIsLocating(true);
    try {
      const location = await getCurrentLocationWithRetry();
      applyMarkerPosition(location.latitude, location.longitude, location.accuracy);
      mapRef.current?.setView([location.latitude, location.longitude], 16);
    } catch {
      // Errors are toasted in getCurrentLocationWithRetry.
    } finally {
      setIsLocating(false);
    }
  };

  const handleSend = async () => {
    if (!selectedCoords || isBusy) return;

    setIsSendingLocal(true);
    try {
      const location = {
        latitude: selectedCoords.latitude,
        longitude: selectedCoords.longitude,
        ...(selectedAccuracy != null ? { accuracy: selectedAccuracy } : {}),
        capturedAt: new Date().toISOString(),
      };
      const didSend = await onSend(location);
      if (didSend) onOpenChange?.(false);
    } finally {
      setIsSendingLocal(false);
    }
  };

  return (
    <Modal.Root state={modal}>
      <Modal.Backdrop variant="opaque">
        <Modal.Container
          className="m-0! h-dvh! w-full! max-h-none! max-w-none!"
          scroll="inside"
          placement="center"
        >
          <Modal.Dialog className="flex h-dvh w-full max-h-none max-w-none flex-col rounded-none border-0 bg-surface text-foreground shadow-none">
            <Modal.Header className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
              <Modal.Heading className="text-lg font-semibold">Send location</Modal.Heading>
              <Modal.CloseTrigger />
            </Modal.Header>

            <Modal.Body className="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden p-0">
              <p className="shrink-0 px-4 py-3 text-sm text-muted">
                Tap the map to pick a spot, drag the pin, or use your current location.
              </p>

              <div className="relative min-h-0 flex-1">
                <div ref={mapContainerRef} className="absolute inset-0 h-full w-full" />
                {isLocating ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <LoaderIcon className="size-8 animate-spin text-white" strokeWidth={2} />
                  </div>
                ) : null}
              </div>

              <div className="shrink-0 space-y-3 border-t border-border bg-surface px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                {selectedCoords ? (
                  <p className="text-sm font-medium text-foreground">
                    {formatCoordinates(selectedCoords.latitude, selectedCoords.longitude)}
                    {selectedAccuracy != null ? (
                      <span className="ml-2 text-xs font-normal text-muted">
                        ±{Math.round(selectedAccuracy)} m
                      </span>
                    ) : null}
                  </p>
                ) : null}

                <Button
                  variant="secondary"
                  className="w-full gap-2"
                  isDisabled={isBusy}
                  onPress={handleUseCurrentLocation}
                >
                  {isLocating ? (
                    <LoaderIcon className="size-4 animate-spin" strokeWidth={2} aria-hidden />
                  ) : (
                    <CrosshairIcon className="size-4" strokeWidth={2} aria-hidden />
                  )}
                  Use current location
                </Button>

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button variant="ghost" isDisabled={isBusy} onPress={() => onOpenChange?.(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    className="gap-2 sm:min-w-36"
                    isDisabled={!selectedCoords || isBusy}
                    onPress={handleSend}
                  >
                    {isSending || isSendingLocal ? (
                      <>
                        <LoaderIcon className="size-4 animate-spin" strokeWidth={2} aria-hidden />
                        Sending...
                      </>
                    ) : (
                      "Send location"
                    )}
                  </Button>
                </div>
              </div>
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal.Root>
  );
}
