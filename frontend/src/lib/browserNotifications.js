export async function requestNotificationPermission() {
  if (typeof Notification === "undefined") {
    return "denied";
  }

  if (Notification.permission === "granted" || Notification.permission === "denied") {
    return Notification.permission;
  }

  return Notification.requestPermission();
}

export function showBrowserNotification({ title, body, icon, onClick }) {
  if (typeof Notification === "undefined") return null;
  if (Notification.permission !== "granted") return null;
  if (!document.hidden) return null;

  const notification = new Notification(title, {
    body,
    icon: icon || undefined,
  });

  notification.onclick = () => {
    window.focus();
    notification.close();
    onClick?.();
  };

  return notification;
}
