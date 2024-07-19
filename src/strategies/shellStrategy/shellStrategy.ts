import { ensureDirSync } from "fs-extra";
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
import { killProcessToolFunction } from "./toolFunctions/killProcess/killProcessFunctionDefinition";
import { runProcessToolFunction } from "./toolFunctions/runProcess/runProcessFunctionDefinition";
import { shellExecToolFunction } from "./toolFunctions/shellExec/shellExecFunctionDefinition";
import { writeFileToolFunction } from "./toolFunctions/writeFile/writeFileFunctionDefinition";
import { getRunToolErrorCount } from "../../chatState";

export class ShellStrategy implements ChatStrategy {
  async init() {
    ensureDirSync(PROJECT_DIR);
  }

  toolFunctions = [
    shellExecToolFunction,
    runProcessToolFunction,
    killProcessToolFunction,
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
    // this basic implementation just returns the vanilla system prompt, messages, and tools
    // i.e. attempts nothing dynamic, a standard continuous chat

    let tools = this.getTools();
    if (this.callCount >= MAX_TOOL_CALL_ITERATIONS) {
      logger.info(`Maximum iterations reached: ${this.callCount}`);
      const lastToolCallResponse =
        toolCallResponses[toolCallResponses.length - 1];
      lastToolCallResponse.content +=
        "\nYou've reached the maximum number of tool calls, do not call any more tools now, update the user with progress so far instead and check if they wish to continue";
    }

    const runToolErrorCount = getRunToolErrorCount();
    if (runToolErrorCount >= MAX_TOOL_ERRORS_PER_RUN) {
      logger.info(`Maximum tool errors reached: ${runToolErrorCount}`);
      const lastToolCallResponse =
        toolCallResponses[toolCallResponses.length - 1];
      lastToolCallResponse.content +=
        "\nYou've reached the maximum number of tool errors for this run, do not call any more tools now, update the user with progress so far instead and check if they wish to continue";
    }

    // If the first message is not the system prompt then prepend it
    if (!messages[0] || messages[0].role !== "system") {
      const systemPromptMessage: Message = {
        role: "system",
        content: this.getSystemPrompt(),
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

  private getSystemPrompt() {
    return `You are software engineer who has been tasked with building any software project the user requires.

Example projects include a building a full stack web application with SQLite database, a REST API, and a React frontend.

You will likely be instructed to or select a popular programming language and framework to build the project.

You have access to a project directory where you should do all your work.

The tools provided include giving you root linux shell access to the directory, you can perform any commands you wish to help
create the project, including installing any programs or packages you might need such as Rust, Python, pip, npm, yarn, etc.

Given you have root access, you do not need to use sudo.

IMPORTANT: Do not use the shell to write files or start or stop process, use the tools provided, otherwise use any shell command you like.

YOU MUST NEVER run a blocking process such as example 'npm run dev', 'cargo run', 'python manage.py runserver' etc.) with the shell, ALWAYS use therun the  runProcess tool function, otherwise the chat will hang.

If you want to run a process that exposes a port, like a webserver, always choose port 8080 and the IP address 0.0.0.0.

Work step by step with the user, if a tool call fails, update the user with the error and check if they wish to continue.

If commands have not worked as expected stop and check with the user, don't try and make non-idomatic fixes.`;
  }
}
