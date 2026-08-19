import { useEffect, useRef } from "react";
import { useCallMediaState } from "../../hooks/useLivekitCall";

export function RemoteVideoFeed({ className }) {
  const { remoteVideoTrack, remoteVideoMuted } = useCallMediaState();
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || !remoteVideoTrack || remoteVideoMuted) return;
    remoteVideoTrack.attach(element);
    return () => {
      remoteVideoTrack.detach(element);
    };
  }, [remoteVideoTrack, remoteVideoMuted]);

  return <video ref={ref} autoPlay playsInline className={className} />;
}

export function LocalVideoFeed({ className }) {
  const { localCameraTrack } = useCallMediaState();
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || !localCameraTrack) return;
    localCameraTrack.attach(element);
    return () => {
      localCameraTrack.detach(element);
    };
  }, [localCameraTrack]);

  return <video ref={ref} autoPlay playsInline muted className={className} />;
}