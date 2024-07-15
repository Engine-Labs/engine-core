import { ChatState } from "./types/chat";

const CHAT_STATE: ChatState = {
  inProgress: false,
  cancelled: false,
  lastSuccessfulToolCall: null,
  lastToolCall: {
    name: null,
    success: false,
  },
  perRunToolErrorCount: 0,
};

export function popLastSuccessfulToolCall() {
  const lastToolCall = CHAT_STATE.lastSuccessfulToolCall;
  if (lastToolCall) {
    CHAT_STATE.lastSuccessfulToolCall = null;
  }
  return lastToolCall;
}

export function isChatInProgress() {
  return CHAT_STATE.inProgress;
}

export function setChatInProgress() {
  CHAT_STATE.inProgress = true;
}

export function getRunToolErrorCount() {
  return CHAT_STATE.perRunToolErrorCount;
}

export function isChatCancelled() {
  return CHAT_STATE.cancelled;
}

export function setChatCancelled() {
  CHAT_STATE.cancelled = true;
}

export function setLastToolCall(name: string, success: boolean) {
  CHAT_STATE.lastToolCall = {
    name: name,
    success: success,
  };
  if (!success) {
    CHAT_STATE.perRunToolErrorCount += 1;
  } else {
    CHAT_STATE.lastSuccessfulToolCall = name;
    CHAT_STATE.perRunToolErrorCount = 0;
  }
}

export function endChatState() {
  CHAT_STATE.inProgress = false;
  CHAT_STATE.cancelled = false;
  CHAT_STATE.perRunToolErrorCount = 0;
  CHAT_STATE.lastToolCall = {
    name: null,
    success: false,
  };
}

export function getLastToolCall() {
  return CHAT_STATE.lastToolCall;
}
