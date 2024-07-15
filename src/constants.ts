export const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export const CHAT_HISTORY_FILE = "chat_history.json";

export const MAX_TOOL_CALL_ITERATIONS = 10;

export const logger = require("pino")();
