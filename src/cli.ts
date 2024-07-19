import "dotenv/config";
import inquirer from "inquirer";
import { select } from "@inquirer/prompts";
import { Readable } from "stream";
import { chat } from "./chat";
import { chatAdapters, chatStrategies, logger } from "./constants";
import type { ChatParams, Message } from "./types/chat";

async function main() {
  logger.level = "info";
  const chatStrategyKey = await select({
    message: "Select a chat strategy",
    choices: [
      {
        name: "Shell Strategy",
        value: "shellStrategy",
        description: "Build anything with a shell powered LLM",
      },
      {
        name: "Demo Strategy",
        value: "demoStrategy",
        description: "Simple example strategy with a single tool function",
      },
    ],
  });

  const ChatStrategy = chatStrategies[chatStrategyKey];
  await new ChatStrategy().init();

  const chatApapterKey = await select({
    message: "Select a chat adapter",
    choices: [
      {
        name: "Claude Sonnet",
        value: "claudeSonnet",
        description: "Claude Sonnet chat adapter",
      },
      {
        name: "GPT-4",
        value: "gpt4",
        description: "GPT-4 chat adapter",
      },
    ],
  });

  const chatLoop = async () => {
    process.stdout.write("\n\n");
    const stream = new Readable({
      read(_size) {},
    });

    const { message } = await inquirer.prompt([
      {
        type: "input",
        name: "message",
        message: "Chat:",
      },
    ]);

    if (message === "exit" || message === "quit") {
      process.exit(0);
    }

    const userMessage = {
      role: "user",
      content: message,
    };

    let prevStreamData = { type: "" };
    stream.on("data", (chunk) => {
      const streamData = JSON.parse(chunk.toString());

      // Cludge in line break after tool calls
      if (
        prevStreamData &&
        prevStreamData.type === "tool" &&
        streamData.type === "chat"
      ) {
        process.stdout.write("\n\n");
      }

      if (streamData.type === "chat") {
        process.stdout.write(streamData.chat.content);
      }

      if (streamData.type === "tool") {
        if (streamData.tool.name) {
          // process.stdout.write(
          //   `\n\nCALLING TOOL FUNCTION: ${streamData.tool.name}\n`
          // );
        }
        if (streamData.tool.content) {
          process.stdout.write(streamData.tool.content);
        }
      }

      prevStreamData = streamData;
    });

    await cliChat(chatStrategyKey, chatApapterKey, userMessage, stream);
    await chatLoop();
  };

  await chatLoop();
}

main().catch((error) => {
  console.error("An error occurred:", error);
  process.exit(1);
});

async function cliChat(
  chatStrategyKey: string,
  chatAdapterKey: string,
  userMessage: Message,
  stream: Readable
) {
  const ChatStrategy = chatStrategies[chatStrategyKey];
  const ChatAdapter = chatAdapters[chatAdapterKey];

  if (!ChatStrategy) {
    process.stdout.write("Invalid chat strategy - exiting :(\n");
    await new Promise((resolve) => setTimeout(resolve, 2000));
    process.exit(1);
  }

  if (!ChatAdapter) {
    process.stdout.write("Invalid chat adapter - exiting :(\n");
    await new Promise((resolve) => setTimeout(resolve, 2000));
    process.exit(1);
  }

  const params: ChatParams = {
    userMessage: userMessage,
    stream: stream,
    chatAdapter: new ChatAdapter(),
    chatStrategy: new ChatStrategy(),
  };

  return await chat(params);
}
