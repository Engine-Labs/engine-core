import { exec as originalExec, spawn } from "child_process";
import fetchRetry from "fetch-retry";
import { copySync, ensureDirSync, readdirSync } from "fs-extra";
import Handlebars from "handlebars";
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
  BackendStrategySystemPromptVars,
  ChatAdapterChatParams,
  ChatStrategy,
  Message,
  ToolFunction,
} from "../../types/chat";
import { deleteBackendFileToolFunction } from "./toolFunctions/deleteBackendFile/deleteBackendFileFunctionDefinition";
import { editBackendFileToolFunction } from "./toolFunctions/editBackendFile/editBackendFileFunctionDefinition";
import { executeSql } from "./toolFunctions/executeSql/executeSqlFunctionActions";
import { executeSqlToolFunction } from "./toolFunctions/executeSql/executeSqlFunctionDefinition";
import { dbMigrate } from "./toolFunctions/migrateDatabase/migrateDatabaseFunction";
import { migrateToolFunction } from "./toolFunctions/migrateDatabase/migrateDatabaseFunctionDefinition";
import { planBackendFileChangesToolFunction } from "./toolFunctions/planBackendFileChanges/planBackendFileChangesFunctionDefinition";
import { writeBackendFileToolFunction } from "./toolFunctions/writeBackendFile/writeBackendFileFunctionDefinition";

const fetchWithRetry = fetchRetry(fetch);
const exec = promisify(originalExec);

async function waitForApiToStart(): Promise<void> {
  console.info("Waiting for API to start");
  try {
    const response = await fetchWithRetry("http://0.0.0.0:8080/docs/json", {
      retries: 3,
      retryDelay: 1000,
    });
    if (response.ok) {
      console.info("API started at http://0.0.0.0:8080");
    } else {
      console.info("Unable to check if API has started at http://0.0.0.0:8080");
    }
  } catch (error) {
    console.info("Unable to check if API has started at http://0.0.0.0:8080");
  }
}

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
      console.info("Copying template to project directory");
      copySync(templateDir, PROJECT_DIR);
    }

    console.info("Installing bun dependencies");
    await exec(`cd ${PROJECT_DIR} && bun install`);

    const migrationFiles = readdirSync(PROJECT_API_MIGRATIONS_DIR);
    if (migrationFiles.length > 1) {
      console.info("Running database migrations");
      await dbMigrate();
    }

    await exec(`cd ${PROJECT_DIR} && bun prisma generate`);

    spawn("bun", ["start"], {
      stdio: "pipe",
      detached: true,
      shell: false,
      cwd: PROJECT_DIR,
    });

    await waitForApiToStart();
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
      const renderedSystemPrompt = await this.getSystemPrompt();
      const systemPromptMessage: Message = {
        role: "system",
        content: renderedSystemPrompt,
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
    # Task instructions

You are an expert software engineer who implements backend web applications on behalf of your users.
You have access to tools which let you take actions to enact user requests.
You are only able to help users with requests that are possible to fulfil with just a database, or a database and a backend API.
For example, you cannot help with creating a native app, but you may be able to translate user requirements into an implementation of a backend for the app.

When you can, use your tools - don't render code you're going to write, call the tools instead.

We will dynamically alter the tools you have access to, you must only use the tools you have access to at the time.

Keep replies within 3 to 5 sentences. Take a deep breath and think step by step.

## Instructions for API

## Guidelines for writing backend API code

You can write endpoints for a Fastify API in TypeScript.
Each endpoint must be in a separate file.
All code that defines API endpoints must be in the \`/src/endpoints\` directory - all endpoints in this directory will automatically be added to the server routes.
Therefore, you do not need to write any code to handle server routes yourself.
When you create database migrations, we will automatically generate the Prisma schema from this for the API to use - the Prisma schema is therefore a generated artifact and should not be edited directly.

## Current backend API files and folders

The following files make up the API. You are able to fetch the contents of any of these files and write to them.
You will be automatically provided with the file contents when designing changes to an existing backend file.

{{{apiFileTree}}}

## Current OpenAPI document

The following YAML document describes the current API.

\`\`\`yaml
{{{openApiDocument}}}
\`\`\`

## Guidelines for writing SQL

You are an expert at writing SQLite SQL.
YOU MUST USE MIGRATIONS WHEN ALTERING THE DATABASE SCHEMA.
Execute SQL directly only when you want to create, read, update or delete data.

The SQLite database that you have access has special features that regular SQLite does not.
It allows altering tables to add, remove and change foreign key constraints from columns without having to recreate the table.
For example, you can do this with a statement that looks like:

\`\`\`sql
ALTER TABLE emails ALTER COLUMN user_id TO user_id INTEGER REFERENCES users(id);
\`\`\`

Foreign key constraints on columns with \`REFERENCES\`, e.g. \`user_id INTEGER REFERENCES users (id)\` can be removed as below.

\`\`\`sql
ALTER TABLE emails ALTER COLUMN user_id TO user_id INTEGER;
\`\`\`

Foreign key constraints on tables, e.g. \`FOREIGN KEY (user_id) REFERENCES users(id)\` cannot be removed in the above way, so avoid setting constraints on tables - try to only set constraints on columns.
Instead, you will need to recreate the table without the constraint and migrate the data into it.

Assume \`PRAGMA foreign_keys=ON\` - do not turn it off.

### Current database schema

The current state of the database is described in the following schema.
You are able to freely discuss this with the user.

{{{databaseSchema}}}

Always strive for accuracy, clarity, and efficiency in your responses and actions. Your instructions must be precise and comprehensive.`;

    try {
      const systemPromptTemplate = Handlebars.compile(promptTemplate);
      const systemPromptVars = await this.getSystemPromptVars();
      let systemPromptRendered = systemPromptTemplate(systemPromptVars);

      systemPromptRendered = systemPromptRendered.trim().replace(/\n/g, " ");
      systemPromptRendered = systemPromptRendered.replace(/ {4}/g, " ");

      return systemPromptRendered;
    } catch (e) {
      logger.error(e);
      throw new Error("Backend strategy system prompt not found");
    }
  }

  async getSystemPromptVars(): Promise<BackendStrategySystemPromptVars> {
    const [openApiDocument, databaseSchema, apiFileTree] = await Promise.all([
      this.getOpenApiDocument(),
      this.getDatabaseSchema(),
      this.getApiFileTree(),
    ]);

    return {
      apiFileTree: apiFileTree,
      openApiDocument: openApiDocument,
      databaseSchema: databaseSchema,
    };
  }

  async getOpenApiDocument(): Promise<string> {
    const openApiUrl = "http://0.0.0.0:8080/api/docs/yaml";
    const response = await fetchWithRetry(openApiUrl, {
      retries: 3,
      retryDelay: 1000,
    });
    return response.text();
  }

  async getDatabaseSchema(): Promise<string> {
    try {
      const result = await executeSql("SELECT sql FROM sqlite_schema;");
      const schema = Object.values(result)
        .map((row: any) => row.sql)
        .join("\n");
      return schema.trim();
    } catch (error) {
      logger.error(error);
      throw new Error("Failed to dump schema");
    }
  }

  async getApiFileTree(): Promise<string> {
    const projectFilesPromise = await exec(
      `tree ${PROJECT_DIR} -I 'node_modules|bin|bun.lockb|nodemon.json|project.db*'`
    );

    return projectFilesPromise.stdout;
  }
}
