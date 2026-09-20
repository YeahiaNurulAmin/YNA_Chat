/**
 * Message actions dropdown (Reply / Forward / Delete).
 * Used in MessageBubble footer; portals a fixed menu so it stays
 * on-screen for both left (peer) and right (own) bubbles.
 */

import { Button } from "@heroui/react";
import { ForwardIcon, MoreVerticalIcon, ReplyIcon, Trash2Icon } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const VIEWPORT_PAD = 8;
const MENU_GAP = 6;

export function MessageActionsMenu({ isOwnMessage, onReply, onForward, onDelete }) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, ready: false });
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  useLayoutEffect(() => {
    if (!isOpen) {
      setCoords({ top: 0, left: 0, ready: false });
      return undefined;
    }

    const placeMenu = () => {
      const trigger = triggerRef.current;
      const menu = menuRef.current;
      if (!trigger || !menu) return;

      const rect = trigger.getBoundingClientRect();
      const menuWidth = menu.offsetWidth;
      const menuHeight = menu.offsetHeight;
      const maxLeft = window.innerWidth - menuWidth - VIEWPORT_PAD;
      const maxTop = window.innerHeight - menuHeight - VIEWPORT_PAD;

      // Prefer opening above; flip below if there isn't enough room.
      let top = rect.top - menuHeight - MENU_GAP;
      if (top < VIEWPORT_PAD) {
        top = rect.bottom + MENU_GAP;
      }
      top = Math.min(Math.max(VIEWPORT_PAD, top), Math.max(VIEWPORT_PAD, maxTop));

      // Own (right) bubbles: align to the trigger's right edge.
      // Peer (left) bubbles: align to the trigger's left edge, growing inward.
      let left = isOwnMessage ? rect.right - menuWidth : rect.left;
      left = Math.min(Math.max(VIEWPORT_PAD, left), Math.max(VIEWPORT_PAD, maxLeft));

      setCoords({ top, left, ready: true });
    };

    placeMenu();
    window.addEventListener("resize", placeMenu);
    window.addEventListener("scroll", placeMenu, true);
    return () => {
      window.removeEventListener("resize", placeMenu);
      window.removeEventListener("scroll", placeMenu, true);
    };
  }, [isOpen, isOwnMessage]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      const target = event.target;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      setIsOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const closeMenu = () => setIsOpen(false);

  const menu =
    isOpen && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={menuRef}
            role="menu"
            className="msg-actions-menu"
            style={{
              top: coords.top,
              left: coords.left,
              visibility: coords.ready ? "visible" : "hidden",
            }}
          >
            <button
              type="button"
              role="menuitem"
              className="msg-actions-menu__item"
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
              className="msg-actions-menu__item"
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
                className="msg-actions-menu__item msg-actions-menu__item--danger"
                onClick={() => {
                  onDelete();
                  closeMenu();
                }}
              >
                <Trash2Icon className="size-4 shrink-0" strokeWidth={2} aria-hidden />
                Delete
              </button>
            ) : null}
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="relative shrink-0">
      <span ref={triggerRef} className="inline-flex">
        <Button
          variant="ghost"
          isIconOnly
          size="sm"
          aria-label="Message options"
          aria-expanded={isOpen}
          className={`size-6 min-w-6 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 ${
            isOpen ? "opacity-100" : ""
          } text-[var(--cl-outline)] hover:text-[var(--cl-glow-violet)]`}
          onPress={() => setIsOpen((open) => !open)}
        >
          <MoreVerticalIcon className="size-4" strokeWidth={2} aria-hidden />
        </Button>
      </span>
      {menu}
    </div>
  );
}
