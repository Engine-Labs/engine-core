import path from "path";
import { ClaudeOpusAdapter } from "./adapters/claudeOpusAdapter";
import { ClaudeSonnetAdapter } from "./adapters/claudeSonnetAdapter";
import { Gpt4Adapter } from "./adapters/gpt4Adapter";
import { DemoStrategy } from "./strategies/demoStrategy/demoStrategy";
import { ShellStrategy } from "./strategies/shellStrategy/shellStrategy";
import { ChatAdapterConstructor, ChatStrategyConstructor } from "./types/chat";

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
export const MAX_TOOL_ERRORS_PER_RUN = 3;

export const logger = require("pino")();

export const chatStrategies: Record<string, ChatStrategyConstructor> = {
  demoStrategy: DemoStrategy,
  shellStrategy: ShellStrategy,
};

export const chatAdapters: Record<string, ChatAdapterConstructor> = {
  claudeOpus: ClaudeOpusAdapter,
  claudeSonnet: ClaudeSonnetAdapter,
  gpt4: Gpt4Adapter,
};
