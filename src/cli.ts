import { select } from "@inquirer/prompts";
import "dotenv/config";
import inquirer from "inquirer";
import { Readable } from "stream";
import { chat } from "./chat";
import {
  ANTHROPIC_API_KEY,
  chatAdapters,
  chatStrategies,
  OPENAI_API_KEY,
} from "./constants";
import type { ChatParams, Message } from "./types/chat";

async function cliChat(
  chatStrategyKey: string,
  chatAdapterKey: string,
  userMessage: Message,
  stream: Readable
) {
  const ChatStrategy = chatStrategies[chatStrategyKey];
  const ChatAdapter = chatAdapters[chatAdapterKey];

  const params: ChatParams = {
    userMessage: userMessage,
    stream: stream,
    chatAdapter: new ChatAdapter(),
    chatStrategy: new ChatStrategy(),
  };

  return await chat(params);
}

async function chatLoop(chatStrategyKey: string, chatAdapterKey: string) {
  process.stdout.write("\n\n");
  const stream = new Readable({
    read(_size) {},
  });

  let message;
  while (!message) {
    const response = await inquirer.prompt([
      {
        type: "input",
        name: "message",
        message: "Chat:",
      },
    ]);

    if (response.message === "exit" || response.message === "quit") {
      process.stdout.write("Exiting...\n");
      process.exit(0);
    }

    message = response.message;
  }

  const userMessage = {
    role: "user",
    content: message,
  };

  let prevStreamData = { type: "" };
  stream.on("data", (chunk) => {
    const streamData = JSON.parse(chunk.toString());

    if (
      prevStreamData &&
      prevStreamData.type === "chat" &&
      streamData.type === "tool"
    ) {
      process.stdout.write("\n\n");
    }

    if (streamData.type === "chat") {
      process.stdout.write(streamData.chat.content);
    }
    prevStreamData = streamData;
  });

  await cliChat(chatStrategyKey, chatAdapterKey, userMessage, stream);
}

async function main() {
  const chatAdapterKey = await select({
    message: "Select a chat adapter",
    choices: [
      {
        name: "Claude Sonnet",
        value: "claudeSonnet",
        description: "Claude Sonnet chat adapter",
      },
      {
        name: "Claude Opus",
        value: "claudeOpus",
        description: "Claude Opus chat adapter",
      },
      {
        name: "GPT-4o",
        value: "gpt4o",
        description: "GPT-4o chat adapter",
      },
      {
        name: "GPT-4o-mini",
        value: "gpt4oMini",
        description: "GPT-4o-mini chat adapter",
      },
    ],
  });

  if (
    (chatAdapterKey === "gpt4o" || chatAdapterKey === "gpt4oMini") &&
    !OPENAI_API_KEY
  ) {
    process.stdout.write(
      "\nERROR: Please set OPENAI_API_KEY in your .env file to continue\n"
    );
    process.exit(1);
  }

  if (
    (chatAdapterKey === "claudeSonnet" || chatAdapterKey === "claudeOpus") &&
    !ANTHROPIC_API_KEY
  ) {
    process.stdout.write(
      "\nERROR: Please set ANTHROPIC_API_KEY in your .env file to continue\n"
    );
    process.exit(1);
  }

  const chatStrategyKey = process.env.CHAT_STRATEGY || "backendStrategy";

  const ChatStrategy = new chatStrategies[chatStrategyKey]();
  await ChatStrategy.init();

  process.stdin.on("data", (key) => {
    const keyString = key.toString();
    if (
      keyString === "\u0003" || // Ctrl + C
      keyString === "\u001b" || // ESC
      keyString === "\u0004" // Ctrl + D
    ) {
      process.stdout.write("Exiting...\n");
      process.exit(0);
    }
  });

  while (true) {
    await chatLoop(chatStrategyKey, chatAdapterKey);
  }
}

main().catch((error) => {
  console.error("An error occurred:", error);
  process.exit(1);
});
