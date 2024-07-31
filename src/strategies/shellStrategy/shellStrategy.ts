import Handlebars from "handlebars";
import { getRunToolErrorCount } from "../../chatState";
import { runProcessToolFunction } from "./toolFunctions/runProcess/runProcessFunctionDefinition";
import { shellExecToolFunction } from "./toolFunctions/shellExec/shellExecFunctionDefinition";
import { writeFileToolFunction } from "./toolFunctions/writeFile/writeFileFunctionDefinition";
import {
  ChatAdapterChatParams,
  ChatStrategy,
  HistoryMessage,
  Message,
  ToolFunction,
} from "../../types/chat";
import {
  logger,
  MAX_TOOL_CALL_ITERATIONS,
  MAX_TOOL_ERRORS_PER_RUN,
  PROJECT_DIR,
} from "../../constants";
import { ensureDirSync } from "fs-extra";

export class ShellStrategy implements ChatStrategy {
  async init() {
    ensureDirSync(PROJECT_DIR);
  }

  toolFunctions = [
    shellExecToolFunction,
    runProcessToolFunction,
    writeFileToolFunction,
  ];

  HISTORY_LIMIT = 20;

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

  requiresInit(): boolean {
    return false;
  }

  async onRunComplete(messages: Message[]): Promise<void> {}

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
        "\nYou've reached the maximum number of tool calls, do not call any more tools now. Do not apologise to the user, but update them with progress so and check if they wish to continue";
    }

    const runToolErrorCount = getRunToolErrorCount();
    if (runToolErrorCount >= MAX_TOOL_ERRORS_PER_RUN) {
      logger.info(`Maximum tool errors reached: ${runToolErrorCount}`);
      const lastToolCallResponse =
        toolCallResponses[toolCallResponses.length - 1];
      lastToolCallResponse.content +=
        "\nYou've reached the maximum number of tool errors for this run, do not call any more tools now. Do not apologise to the user, but update them with progress so and check if they wish to continue";
    }

    if (messages[0] && messages[0].role === "system") {
      messages.shift();
    }
    messages.unshift(await this.getSystemPrompt());

    this.callCount += 1;

    return {
      messages: [...messages, ...toolCallResponses],
      tools: tools,
    };
  }

  getChatHistory(completeHistory: HistoryMessage[]): Message[] {
    // Get messages up to the history limit
    let startIndex = Math.max(0, completeHistory.length - this.HISTORY_LIMIT);
    let chatHistory = completeHistory.slice(startIndex);

    // Include previous messages until one with the role 'user' is reached
    while (startIndex > 0 && chatHistory[0].role !== "user") {
      startIndex--;
      chatHistory = completeHistory.slice(startIndex);
    }

    return chatHistory.map((historyMessage) => {
      let content = historyMessage.content;
      if (historyMessage.role === "tool") {
        switch (historyMessage.is_error) {
          case true:
            content = `<tool call errored - output truncated>`;
            break;
          case false:
            content = `<tool call successful - output truncated>`;
            break;
          default:
            content = `<tool call output truncated>`;
        }
      }

      const message: Message = {
        role: historyMessage.role,
        content: content,
      };

      if (historyMessage.tool_call_id) {
        message.tool_call_id = historyMessage.tool_call_id;
      }

      if (historyMessage.tool_calls) {
        message.tool_calls = historyMessage.tool_calls;
      }

      return message;
    });
  }

  private getTools(): ToolFunction[] {
    return this.toolFunctions;
  }

  private async getSystemPrompt() {
    const promptTemplate = `
You are an AI assistant acting as a skilled software engineer. Your task is to build any software project the user requires. Follow these instructions carefully:

1. Available tools and system setup:
- You have Linux shell access to the project directory.
- You can use any shell command, install programs, and manage packages.
- The following are pre-installed: wget, curl, unzip, sqlite3, tree, lsof, procps, libssl-dev, git, build-essential, python3, python3-pip, python3-venv, rust, nodejs, yarn, bun.
- Your shell is running as a user with full sudo access without requiring a password.

2. Project directory review:
- First, review the context of the project directory.
- Determine if you're starting a new project or continuing an existing one.
- Do not overwrite existing work without confirmation.

3. Language and framework selection:
- If instructed, use the specified programming language and framework.
- Otherwise, choose based on the project requirements.

4. Project development:
- Work step-by-step, keeping the user informed of your progress.
- When writing code, don't render code you're going to write; call the tools instead to actually write, compile, and run code.
- Use appropriate tool functions for file operations and process management.
- When installing package, use the appropriate package manager (e.g., pip, npm, yarn, cargo). to install dependencies,
  don't manaually edit files like package.json, Cargo.toml, etc.

5. Using tool functions:
- Use provided tool functions for writing files and starting background processes.
- Do not use the shell to write files or start blocking processes directly.

6. Error handling and user interaction:
- If a tool call fails, inform the user of the error and ask if they want to continue.
- If commands don't work as expected, stop and check with the user before proceeding.

7. Running processes and port exposure:
- Always use the runProcess tool function for blocking processes.
- For webservers or processes exposing ports, use port 8080 and IP address 0.0.0.0.
- The user will be able to access processes running on port 8080 at the URL {{{apiUrl}}}, be sure to let them know.
- Use the shell to stop a process or check if a process is running on port 8080 before starting a new one.

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

Work systematically and keep the user informed throughout the development process.
`;
    try {
      const systemPromptTemplate = Handlebars.compile(promptTemplate);
      let systemPromptRendered = systemPromptTemplate({
        apiUrl: "http://localhost:8080",
      });
      return {
        role: "system",
        content: systemPromptRendered,
      };
    } catch (e) {
      logger.error(e);
      throw new Error("Shell strategy system prompt could not be rendered");
    }
  }
}
