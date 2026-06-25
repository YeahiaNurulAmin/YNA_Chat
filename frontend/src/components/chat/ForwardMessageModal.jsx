import { Avatar, Button, Modal, useOverlayState } from "@heroui/react";
import { getInitials } from "../../hooks/useSelectedConversation";
import { useChatStore } from "../../store/useChatStore";

export function ForwardMessageModal({ isOpen, onOpenChange, message, onForwarded }) {
  const users = useChatStore((state) => state.users);
  const forwardMessage = useChatStore((state) => state.forwardMessage);
  const isForwarding = useChatStore((state) => state.isForwardingMessage);
  const overlay = useOverlayState({
    isOpen,
    onOpenChange,
  });

  const handleForward = async (receiverId) => {
    if (!message?.id) return;

    const didForward = await forwardMessage({
      messageId: message.id,
      receiverId,
    });

    if (didForward) {
      onForwarded?.();
      overlay.close();
    }
  };

  return (
    <Modal state={overlay}>
      <Modal.Backdrop>
        <Modal.Container size="sm">
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Forward message</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <p className="mb-3 text-sm text-muted">Choose who to forward this message to.</p>
              <div className="max-h-64 space-y-1 overflow-y-auto">
                {users.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted">No users available.</p>
                ) : (
                  users.map((user) => (
                    <button
                      key={user._id}
                      type="button"
                      disabled={isForwarding}
                      className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-surface disabled:opacity-60"
                      onClick={() => void handleForward(user._id)}
                    >
                      <Avatar className="size-10 shrink-0">
                        <Avatar.Image alt={user.fullName} src={user.profilePicture} />
                        <Avatar.Fallback className="text-sm font-medium">
                          {getInitials(user.fullName)}
                        </Avatar.Fallback>
                      </Avatar>
                      <span className="truncate text-sm font-medium">{user.fullName}</span>
                    </button>
                  ))
                )}
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onPress={overlay.close}>
                Cancel
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
