import { ToolFunction } from "../../../../types/chat";
import { createMigration } from "./migrateDatabaseFuntion";

const name = "migrateDatabase";

// Description for the llm
const description =
  "Use this function to modify the SQLite database schema by executing SQLite SQL statements in a database migration.";

// JSON schema parameters for the this function
const parameters = {
  title: "CreateMigrationBodySchema",
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

// The function that will be called when this tool is invoked
// Accepts the parameters define here in JSON schema
// MUST return a string which clearly describes the result of the function
// whether it was successful or not
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
