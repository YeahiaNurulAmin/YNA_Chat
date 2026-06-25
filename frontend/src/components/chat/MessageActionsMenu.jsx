import { Button } from "@heroui/react";
import { ForwardIcon, MoreVerticalIcon, ReplyIcon, Trash2Icon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function MessageActionsMenu({ isOwnMessage, onReply, onForward, onDelete }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  const closeMenu = () => setIsOpen(false);

  return (
    <div ref={containerRef} className="relative shrink-0">
      <Button
        variant="ghost"
        isIconOnly
        size="sm"
        aria-label="Message options"
        aria-expanded={isOpen}
        className={`size-6 min-w-6 ${
          isOwnMessage
            ? "text-accent-foreground/80 hover:text-accent-foreground"
            : "text-muted hover:text-foreground"
        }`}
        onPress={() => setIsOpen((open) => !open)}
      >
        <MoreVerticalIcon className="size-4" strokeWidth={2} aria-hidden />
      </Button>

      {isOpen ? (
        <div
          role="menu"
          className="absolute bottom-full right-0 z-20 mb-1 min-w-[9.5rem] overflow-hidden rounded-xl border border-border bg-background py-1 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface"
            onClick={() => {
              onReply();
              closeMenu();
            }}
          >
            <ReplyIcon className="size-4 shrink-0" strokeWidth={2} aria-hidden />
            Reply
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface"
            onClick={() => {
              onForward();
              closeMenu();
            }}
          >
            <ForwardIcon className="size-4 shrink-0" strokeWidth={2} aria-hidden />
            Forward
          </button>
          {isOwnMessage ? (
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-danger hover:bg-danger/10"
              onClick={() => {
                onDelete();
                closeMenu();
              }}
            >
              <Trash2Icon className="size-4 shrink-0" strokeWidth={2} aria-hidden />
              Delete
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
