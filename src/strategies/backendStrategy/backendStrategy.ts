import { exec as originalExec, spawn } from "child_process";
import { copySync, ensureDirSync, readdirSync } from "fs-extra";
import path from "path";
import { promisify } from "util";
import { isDirectoryEmptySync } from "../../chatUtils";
import {
  logger,
  MAX_TOOL_CALL_ITERATIONS,
  PROJECT_API_MIGRATIONS_DIR,
  PROJECT_DIR,
} from "../../constants";
import type {
  ChatAdapterChatParams,
  ChatStrategy,
  Message,
  ToolFunction,
} from "../../types/chat";
import { deleteBackendFileToolFunction } from "./toolFunctions/deleteBackendFile/deleteBackendFileFunctionDefinition";
import { editBackendFileToolFunction } from "./toolFunctions/editBackendFile/editBackendFileFunctionDefinition";
import { executeSqlToolFunction } from "./toolFunctions/executeSql/executeSqlFunctionDefinition";
import { dbMigrate } from "./toolFunctions/migrateDatabase/migrateDatabaseFunction";
import { migrateToolFunction } from "./toolFunctions/migrateDatabase/migrateDatabaseFunctionDefinition";
import { planBackendFileChangesToolFunction } from "./toolFunctions/planBackendFileChanges/planBackendFileChangesFunctionDefinition";
import { writeBackendFileToolFunction } from "./toolFunctions/writeBackendFile/writeBackendFileFunctionDefinition";

const exec = promisify(originalExec);

export class BackendStrategy implements ChatStrategy {
  toolFunctions = [
    deleteBackendFileToolFunction,
    editBackendFileToolFunction,
    executeSqlToolFunction,
    migrateToolFunction,
    planBackendFileChangesToolFunction,
    writeBackendFileToolFunction,
  ];

  async init() {
    ensureDirSync(PROJECT_DIR);

    if (isDirectoryEmptySync(PROJECT_DIR)) {
      const templateDir = path.normalize(
        path.resolve(
          process.cwd(),
          "src",
          "strategies",
          "backendStrategy",
          "projectTemplate"
        )
      );
      logger.info("Copying template to project directory");
      copySync(templateDir, PROJECT_DIR);
    }

    logger.info("Installing bun dependencies");
    await exec(`cd ${PROJECT_DIR} && bun install`);

    const migrationFiles = readdirSync(PROJECT_API_MIGRATIONS_DIR);
    if (migrationFiles.length > 1) {
      logger.info("Running database migrations");
      await dbMigrate();
    }

    spawn("bun", ["start"], {
      stdio: "pipe",
      detached: true,
      shell: false,
      cwd: PROJECT_DIR,
    });
  }

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
    return `You are a helpful assistant`;
  }
}
