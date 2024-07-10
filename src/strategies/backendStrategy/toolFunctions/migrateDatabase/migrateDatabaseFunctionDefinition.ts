import { ToolFunction } from "../../../../types/chat";
import { createMigration } from "./migrateDatabaseFunction";

const name = "migrateDatabase";

const description =
  "Use this tool to modify the SQLite database schema by executing SQLite SQL statements in a database migration.";

const parameters = {
  type: "object",
  properties: {
    upMigrations: {
      type: "object",
      description: "SQLite SQL migration statements",
      properties: {
        sqlStatements: {
          type: "array",
          items: {
            type: "string",
            description: "A SQLite SQL statement to run against a database",
          },
        },
      },
      required: ["sqlStatements"],
    },
    downMigrations: {
      type: "object",
      description: "SQLite SQL migration statements",
      properties: {
        sqlStatements: {
          type: "array",
          items: {
            type: "string",
            description: "A SQLite SQL statement to run against a database",
          },
        },
      },
      required: ["sqlStatements"],
    },
  },
  required: ["upMigrations", "downMigrations"],
};

async function run(params: any): Promise<string> {
  await createMigration(
    params.upMigrations.sqlStatements,
    params.downMigrations.sqlStatements
  );

  return `Successfully ran migration`;
}

export const migrateToolFunction: ToolFunction = {
  name: name,
  description: description,
  getParameters: async () => parameters,
  run: run,
};
