import { Avatar, Button } from "@heroui/react";
import { ChevronLeftIcon, BellIcon, BellOffIcon, PhoneIcon, Volume2Icon, VolumeXIcon, XIcon } from "lucide-react";
import { AppLogo } from "../AppLogo";
import { AvatarWithOnlineIndicator } from "./AvatarWithOnlineIndicator";

import { ThemePresetPicker } from "../ThemePresetPicker";

import { ThemeToggle } from "../ThemeToggle";
import { RgbCustomizer } from "../RgbCustomizer";

import { useChatStore } from "../../store/useChatStore";
import { useCallStore } from "../../store/useCallStore";
import { useSelectedConversation } from "../../hooks/useSelectedConversation";

export function ChatHeader() {
  const isKeyboardSoundEnabled = useChatStore((state) => state.isKeyboardSoundEnabled);
  const isNotificationSoundEnabled = useChatStore((state) => state.isNotificationSoundEnabled);
  const setActiveConversationId = useChatStore((state) => state.setActiveConversationId);
  const setKeyboardSoundEnabled = useChatStore((state) => state.setKeyboardSoundEnabled);
  const setNotificationAlertsEnabled = useChatStore(
    (state) => state.setNotificationAlertsEnabled,
  );

  const { activeConversation, isLargeScreen } = useSelectedConversation();
  const callStatus = useCallStore((state) => state.status);
  const startCall = useCallStore((state) => state.startCall);

  const canStartCall =
    Boolean(activeConversation?.peer.isOnline) && callStatus === "idle";

  const handleStartCall = () => {
    if (!activeConversation || !canStartCall) return;
    void startCall({
      id: activeConversation.id,
      name: activeConversation.peer.name,
      avatarUrl: activeConversation.peer.avatarUrl,
      initials: activeConversation.peer.initials,
    });
  };

  const roundedClass = isLargeScreen ? "rounded-tr-[21px]" : "rounded-t-[21px]";

  return (
    <header className={`sticky top-0 z-10 flex shrink-0 flex-wrap items-center gap-1 border-b border-border px-1.5 py-1.5 sm:gap-2 sm:px-2 sm:py-2 ${roundedClass}`}>
      {activeConversation && !isLargeScreen ? (
        <Button
          variant="ghost"
          size="sm"
          isIconOnly
          className="shrink-0"
          onPress={() => setActiveConversationId(null)}
        >
          <ChevronLeftIcon className="size-6" strokeWidth={2.25} />
        </Button>
      ) : null}

      {activeConversation ? (
        <>
          <AvatarWithOnlineIndicator isOnline={activeConversation.peer.isOnline ?? true}>
            <Avatar className="size-9 shrink-0">
              <Avatar.Image
                alt={activeConversation.peer.name}
                src={activeConversation.peer.avatarUrl}
              />
              <Avatar.Fallback className="text-sm font-medium">
                {activeConversation.peer.initials}
              </Avatar.Fallback>
            </Avatar>
          </AvatarWithOnlineIndicator>

          <div className="flex-1 text-center sm:text-left">
            <p className="truncate text-[15px] font-semibold leading-tight">
              {activeConversation.peer.name}
            </p>
            <p className="truncate text-xs text-muted">
              {activeConversation.peer.isOnline ? (
                <span className="font-medium text-success">Online</span>
              ) : (
                "Offline"
              )}
            </p>
          </div>
        </>
      ) : (
        <div className="flex flex-1 items-center gap-2.5 sm:text-left">
          <AppLogo size={36} className="rounded-[9px]" />
          <div className="flex-1 text-center sm:text-left">
            <p className="truncate text-[13px] font-medium text-muted">Select a conversation</p>
          </div>
        </div>
      )}

      <div className="ml-auto flex max-w-full shrink-0 flex-wrap items-center justify-end gap-0.5 sm:gap-1">
        <div className="hidden min-[400px]:contents">
          <RgbCustomizer />
          <ThemePresetPicker />
        </div>

        <ThemeToggle />

        {activeConversation ? (
          <Button
            variant="ghost"
            size="sm"
            isIconOnly
            className="shrink-0"
            isDisabled={!canStartCall}
            aria-label="Start voice call"
            onPress={handleStartCall}
          >
            <PhoneIcon className="size-5.5" strokeWidth={2} aria-hidden />
          </Button>
        ) : null}

        <Button
          variant="ghost"
          size="sm"
          isIconOnly
          className="shrink-0"
          aria-pressed={isNotificationSoundEnabled}
          aria-label={
            isNotificationSoundEnabled
              ? "Disable notification sounds"
              : "Enable notification sounds"
          }
          onPress={() => setNotificationAlertsEnabled(!isNotificationSoundEnabled)}
        >
          {isNotificationSoundEnabled ? (
            <BellIcon className="size-5.5" strokeWidth={2} aria-hidden />
          ) : (
            <BellOffIcon className="size-5.5" strokeWidth={2} aria-hidden />
          )}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          isIconOnly
          className="shrink-0"
          aria-pressed={isKeyboardSoundEnabled}
          aria-label={
            isKeyboardSoundEnabled ? "Disable keyboard sounds" : "Enable keyboard sounds"
          }
          onPress={() => setKeyboardSoundEnabled(!isKeyboardSoundEnabled)}
        >
          {isKeyboardSoundEnabled ? (
            <Volume2Icon className="size-5.5" strokeWidth={2} aria-hidden />
          ) : (
            <VolumeXIcon className="size-5.5" strokeWidth={2} aria-hidden />
          )}
        </Button>

        {activeConversation ? (
          <Button
            variant="ghost"
            size="sm"
            isIconOnly
            className="shrink-0"
            aria-label="Close chat"
            onPress={() => setActiveConversationId(null)}
          >
            <XIcon className="size-5.5" strokeWidth={2} aria-hidden />
          </Button>
        ) : null}
      </div>
    </header>
  );
}
