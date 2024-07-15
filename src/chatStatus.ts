const DEFAULT_CHAT_STATUS = "Working...";

let CHAT_STATUS: string | null = null;

export function getChatStatus(): string {
  return CHAT_STATUS || DEFAULT_CHAT_STATUS;
}

export function setChatStatus(status: string) {
  CHAT_STATUS = status;
}

export function resetChatStatus() {
  CHAT_STATUS = null;
}
