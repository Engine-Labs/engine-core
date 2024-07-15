import "dotenv/config";
import inquirer from "inquirer";
import { Readable } from "stream";
import { Gpt4Adapter } from "./adapters/gpt4Adapter";
import { chat } from "./chat";
import { logger } from "./constants";
import { DemoStrategy } from "./strategies/demoStrategy/demoStrategy";
import type { ChatParams, Message } from "./types/chat";

async function main() {
  logger.level = "info";

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
          process.stdout.write(
            `\n\nCALLING TOOL FUNCTION: ${streamData.tool.name}\n`
          );
        }
        if (streamData.tool.content) {
          process.stdout.write(streamData.tool.content);
        }
      }

      prevStreamData = streamData;
    });

    await cliChat(userMessage, stream);
    await chatLoop();
  };

  await chatLoop();
}

main().catch((error) => {
  console.error("An error occurred:", error);
  process.exit(1);
});

async function cliChat(message: Message, stream: Readable) {
  const params: ChatParams = {
    message: message,
    stream: stream,
    chatAdapter: new Gpt4Adapter(),
    chatStrategy: new DemoStrategy(),
  };

  return await chat(params);
}
