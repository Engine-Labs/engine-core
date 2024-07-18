// import { ClaudeOpusAdapter } from "./adapters/claudeOpusAdapter";
// import { ClaudeSonnetAdapter } from "./adapters/claudeSonnetAdapter";
// import { Gpt4Adapter } from "./adapters/gpt4Adapter";
import path from "path";
import { DemoStrategy } from "./strategies/demoStrategy/demoStrategy";
import { ChatStrategyConstructor } from "./types/chat";

export const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export const PROJECT_DIR = path.normalize(
  path.normalize(path.resolve(process.cwd(), "project"))
);

export const PROJECT_API_MIGRATIONS_DIR = path.join(
  PROJECT_DIR,
  "db",
  "migrations"
);

export const CHAT_HISTORY_FILE = "chat_history.json";

export const MAX_TOOL_CALL_ITERATIONS = 10;

export const logger = require("pino")();

export const chatStrategies: Record<string, ChatStrategyConstructor> = {
  demoStrategy: DemoStrategy,
};

// export const chatAdapters = {
//   claudeOpus: new ClaudeOpusAdapter(),
//   claudeSonnet: new ClaudeSonnetAdapter(),
//   gpt4: new Gpt4Adapter(),
// };
