const messageSound = new Audio("/sounds/message-notification.wav");

export function playMessageSound() {
  messageSound.currentTime = 0;
  messageSound.play().catch((error) => console.log("Message sound play failed:", error));
}
