import { ensureDirSync } from "fs-extra";
import Handlebars from "handlebars";
import { getRunToolErrorCount } from "../../chatState";
import {
  logger,
  MAX_TOOL_CALL_ITERATIONS,
  MAX_TOOL_ERRORS_PER_RUN,
  PROJECT_DIR,
} from "../../constants";
import type {
  ChatAdapterChatParams,
  ChatStrategy,
  Message,
  ToolFunction,
} from "../../types/chat";
import { runProcessToolFunction } from "./toolFunctions/runProcess/runProcessFunctionDefinition";
import { shellExecToolFunction } from "./toolFunctions/shellExec/shellExecFunctionDefinition";
import { writeFileToolFunction } from "./toolFunctions/writeFile/writeFileFunctionDefinition";

export class ShellStrategy implements ChatStrategy {
  async init() {
    ensureDirSync(PROJECT_DIR);
  }

  toolFunctions = [
    runProcessToolFunction,
    shellExecToolFunction,
    writeFileToolFunction,
  ];

  toolFunctionMap() {
    return Object.fromEntries(
      this.toolFunctions.map((toolFunction) => [
        toolFunction.name,
        toolFunction,
      ])
    );
  }

  getToolFunctionByName(toolFunctionName: string) {
    return (
      this.toolFunctions.find(
        (toolFunction) => toolFunction.name === toolFunctionName
      ) ?? null
    );
  }

  async onRunComplete(_messages: Message[]): Promise<void> {
    return;
  }

  callCount: number = 0;

  async call(
    messages: Message[],
    toolCallResponses: Message[]
  ): Promise<ChatAdapterChatParams> {
    let tools = this.getTools();
    if (this.callCount >= MAX_TOOL_CALL_ITERATIONS) {
      logger.info(`Maximum iterations reached: ${this.callCount}`);
      const lastToolCallResponse =
        toolCallResponses[toolCallResponses.length - 1];
      lastToolCallResponse.content +=
        "\nYou've reached the maximum number of tool calls, do not call any more tools now. Do not apologise to the user, update them with progress and check if they wish to continue";
    }

    const runToolErrorCount = getRunToolErrorCount();
    if (runToolErrorCount >= MAX_TOOL_ERRORS_PER_RUN) {
      logger.info(`Maximum tool errors reached: ${runToolErrorCount}`);
      const lastToolCallResponse =
        toolCallResponses[toolCallResponses.length - 1];
      lastToolCallResponse.content +=
        "\nYou've reached the maximum number of tool errors for this run. Do not apologise to the user, update them with progress and check if they wish to continue";
    }

    // If the first message is not the system prompt then prepend it
    if (!messages[0] || messages[0].role !== "system") {
      const systemPromptMessage: Message = {
        role: "system",
        content: await this.getSystemPrompt(),
      };
      messages.unshift(systemPromptMessage);
    }

    this.callCount += 1;

    return {
      messages: [...messages, ...toolCallResponses],
      tools: tools,
    };
  }

  getChatHistory(completeHistory: Message[]): Message[] {
    return completeHistory;
  }

  private getTools(): ToolFunction[] {
    return this.toolFunctions;
  }

  private async getSystemPrompt() {
    const promptTemplate = `
You are an AI assistant acting as a skilled software engineer. Your task is to build any software project the user requires. Follow these instructions carefully:

1. Available tools and system setup:
- You have root Linux shell access to the project directory.
- You can use any shell command, install programs, and manage packages.
- The following are pre-installed: wget, curl, unzip, sqlite3, tree, lsof, procps, libssl-dev, git, build-essential, python3, python3-pip, python3-venv, rust, nodejs, yarn, bun.
- Do not use sudo as you already have root access.

2. Project directory review:
- First, review the context of the project directory.
- Determine if you're starting a new project or continuing an existing one.
- Do not overwrite existing work without confirmation.

3. Language and framework selection:
- If instructed, use the specified programming language and framework.
- Otherwise, choose based on the project requirements.

4. Project development:
- Work step-by-step, keeping the user informed of your progress.
- Use appropriate tool functions for file operations and process management.

5. Using tool functions:
- Use provided tool functions for writing files, starting, and stopping processes.
- Do not use the shell to write files or manage processes directly.

6. Error handling and user interaction:
- If a tool call fails, inform the user of the error and ask if they want to continue.
- If commands don't work as expected, stop and check with the user before proceeding.

7. Running processes and port exposure:
- Always use the runProcess tool function for blocking processes.
- For webservers or processes exposing ports, use port 8080 and IP address 0.0.0.0.

8. Code compilation and testing:
- Assert that your code compiles before running it.
- For Python scripts, use 'python3 -m py_compile script.py' before execution.
- For Rust, use 'cargo build' before running the binary.
- For other languages, use the appropriate compilation command.

9. Step-by-step work with the user:
- Provide clear updates on your progress.
- Ask for user input or confirmation when necessary.

10. Handling failures and continuing:
- If issues arise, provide a brief update and ask the user if they wish to continue.
- Avoid excessive apologies; focus on problem-solving and progress.

Remember to always use the provided tool functions for file operations and process management. Do not use the shell for these tasks. Work systematically and keep the user informed throughout the development process.
`;

    try {
      const systemPromptTemplate = Handlebars.compile(promptTemplate);
      let systemPromptRendered = systemPromptTemplate({});
      return systemPromptRendered;
    } catch (e) {
      logger.error(e);
      throw new Error("Shell strategy system prompt not found");
    }
  }
}
