import { Avatar, Button, Modal, useOverlayState } from "@heroui/react";
import { useUser } from "@clerk/react";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { CameraIcon, Loader2Icon } from "lucide-react";
import { getInitials } from "../../hooks/useSelectedConversation";
import { useAuthStore } from "../../store/useAuthStore";

export function ProfileEditModal({ isOpen, onOpenChange: onOpenChangeProp }) {
  const { user: clerkUser } = useUser();
  const updateAuthUser = useAuthStore((state) => state.updateAuthUser);
  const authUser = useAuthStore((state) => state.authUser);

  const [name, setName] = useState(authUser?.fullName ?? "");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  const overlay = useOverlayState({
    isOpen,
    onOpenChange: onOpenChangeProp,
  });

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!clerkUser) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Display name cannot be empty");
      return;
    }

    const [first, ...rest] = trimmedName.split(/\s+/);

    setIsSaving(true);
    try {
      await clerkUser.update({
        firstName: first,
        lastName: rest.join(" ") || null,
      });
      let updatedAvatar = authUser?.profilePic || authUser?.profilePicture;
      if (avatarFile) {
        const image = await clerkUser.setProfileImage({ file: avatarFile });
        updatedAvatar = image.publicUrl || clerkUser.imageUrl || avatarPreview;
      }

      const updatedName = [first, rest.join(" ")].filter(Boolean).join(" ") || trimmedName;

      updateAuthUser({
        fullName: updatedName,
        profilePic: updatedAvatar,
        profilePicture: updatedAvatar,
      });

      toast.success("Profile updated");
      overlay.close();
    } catch (error) {
      const message =
        error?.errors?.[0]?.longMessage ??
        error?.errors?.[0]?.message ??
        error?.message ??
        "Failed to update profile";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const avatarUrl = avatarPreview || authUser?.profilePic || authUser?.profilePicture;
  const initials = getInitials(authUser?.fullName ?? "");

  return (
    <Modal state={overlay}>
      <Modal.Backdrop>
        <Modal.Container size="sm">
          <Modal.Dialog className="glass-modal text-[var(--cl-on-surface)]">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading className="font-mono text-sm font-medium tracking-[0.12em] uppercase text-[var(--cl-glow-cyan)]">
                Edit profile
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body className="space-y-4">
              <div className="flex flex-col items-center gap-3">
                <div className="avatar-neon-ring rounded-full">
                  <Avatar className="size-24">
                    <Avatar.Image alt={authUser?.fullName ?? "Profile"} src={avatarUrl} />
                    <Avatar.Fallback className="text-xl font-semibold">{initials}</Avatar.Fallback>
                  </Avatar>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-md border border-[rgba(34,211,238,0.35)] bg-[rgba(34,211,238,0.08)] px-3 py-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--cl-glow-cyan)] transition-colors hover:bg-[rgba(34,211,238,0.14)] focus-visible:outline-none focus-visible:shadow-[var(--cl-focus)]"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <CameraIcon className="size-3.5" strokeWidth={2} />
                  Change photo
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="profile-name" className="auth-field-label">
                  Name
                </label>
                <input
                  id="profile-name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your name"
                  className="auth-field-input w-full text-sm"
                />
              </div>
            </Modal.Body>
            <Modal.Footer className="flex justify-end gap-2">
              <Button variant="secondary" onPress={() => overlay.close()}>
                Cancel
              </Button>
              <Button color="primary" isDisabled={isSaving} onPress={() => void handleSave()}>
                {isSaving ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : (
                  "Save changes"
                )}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}