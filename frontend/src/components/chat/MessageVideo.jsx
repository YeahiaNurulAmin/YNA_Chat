import { useRef } from "react";
import { Button, Modal, useOverlayState } from "@heroui/react";
import { Maximize2Icon } from "lucide-react";
import { isImageKitUrl, withTransform } from "../../lib/imagekit";

const VIDEO_TRANSFORM = "q-80,w-640";
const FULLSCREEN_VIDEO_TRANSFORM = "q-80,w-1280";
const POSTER_TRANSFORM = "q-80,w-640";

function buildPosterUrl(url) {
  if (!isImageKitUrl(url)) return undefined;
  const [path] = url.split("?");
  return withTransform(`${path}/ik-thumbnail.jpg`, POSTER_TRANSFORM);
}

async function requestVideoFullscreen(videoElement) {
  if (!videoElement) return;

  if (videoElement.requestFullscreen) {
    await videoElement.requestFullscreen();
    return;
  }

  if (videoElement.webkitEnterFullscreen) {
    videoElement.webkitEnterFullscreen();
  }
}

export function MessageVideo({ src }) {
  const modal = useOverlayState();
  const inlineVideoRef = useRef(null);
  const fullscreenVideoRef = useRef(null);

  const optimizedSrc = withTransform(src, VIDEO_TRANSFORM);
  const fullscreenSrc = withTransform(src, FULLSCREEN_VIDEO_TRANSFORM);
  const posterSrc = buildPosterUrl(src);

  const openViewer = () => {
    inlineVideoRef.current?.pause();
    modal.open();
  };

  const enterNativeFullscreen = async () => {
    try {
      await requestVideoFullscreen(fullscreenVideoRef.current);
    } catch (error) {
      console.error("Fullscreen failed:", error);
    }
  };

  return (
    <>
      <div className="relative mb-1.5 max-w-full">
        <video
          ref={inlineVideoRef}
          src={optimizedSrc}
          poster={posterSrc}
          controls
          playsInline
          preload="metadata"
          className="max-h-52 max-w-full rounded-lg object-contain sm:max-h-64 sm:rounded-xl"
        />
        <Button
          variant="secondary"
          size="sm"
          isIconOnly
          aria-label="Open video in fullscreen"
          className="absolute right-2 top-2 size-8 min-w-8 bg-black/55 text-white backdrop-blur-sm"
          onPress={openViewer}
        >
          <Maximize2Icon className="size-4" strokeWidth={2} />
        </Button>
      </div>

      <Modal.Root state={modal}>
        <Modal.Backdrop variant="opaque">
          <Modal.Container size="lg" placement="center">
            <Modal.Dialog className="max-h-[90dvh] w-[min(96vw,56rem)] border border-border bg-surface p-0 shadow-2xl">
              <Modal.Header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                <Modal.Heading className="text-base font-semibold">Video</Modal.Heading>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onPress={enterNativeFullscreen}>
                    Fullscreen
                  </Button>
                  <Modal.CloseTrigger />
                </div>
              </Modal.Header>

              <Modal.Body className="flex items-center justify-center bg-black p-2 sm:p-4">
                <video
                  ref={fullscreenVideoRef}
                  src={fullscreenSrc}
                  poster={posterSrc}
                  controls
                  playsInline
                  autoPlay
                  className="max-h-[calc(90dvh-5rem)] w-full rounded-lg object-contain"
                />
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal.Root>
    </>
  );
}
