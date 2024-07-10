import path from "path";
import pino from "pino";
import { ClaudeOpusAdapter } from "./adapters/claudeOpusAdapter";
import { ClaudeSonnetAdapter } from "./adapters/claudeSonnetAdapter";
import { Gpt4oAdapter } from "./adapters/gpt4oAdapter";
import { Gpt4oMiniAdapter } from "./adapters/gpt4oMiniAdapter";
import { BackendStrategy } from "./strategies/backendStrategy/backendStrategy";
import { DemoStrategy } from "./strategies/demoStrategy/demoStrategy";
import { ChatAdapterConstructor, ChatStrategyConstructor } from "./types/chat";

const customTransport = pino.transport({
  targets: [
    {
      target: "pino-pretty",
      options: {
        colorize: true,
        messageFormat: "\n>>> {msg}\n",
        ignore: "pid,hostname,time,level",
      },
    },
  ],
});

export const logger = pino(customTransport);

export const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
export const MAX_TOOL_CALL_ITERATIONS = 10;
export const MAX_TOOL_ERRORS_PER_RUN = 3;
export const CHAT_HISTORY_FILE = "chat_history.jsonl";

export const PROJECT_DIR = path.normalize(
  path.normalize(path.resolve(process.cwd(), "project"))
);

export const PROJECT_API_MIGRATIONS_DIR = path.join(
  PROJECT_DIR,
  "db",
  "migrations"
);

export const SQLITE_DB_PATH = path.join(PROJECT_DIR, "prisma", "dev.db");

export const chatStrategies: Record<string, ChatStrategyConstructor> = {
  demoStrategy: DemoStrategy,
  backendStrategy: BackendStrategy,
};

export const chatAdapters: Record<string, ChatAdapterConstructor> = {
  claudeOpus: ClaudeOpusAdapter,
  claudeSonnet: ClaudeSonnetAdapter,
  gpt4o: Gpt4oAdapter,
  gpt4oMini: Gpt4oMiniAdapter,
};
