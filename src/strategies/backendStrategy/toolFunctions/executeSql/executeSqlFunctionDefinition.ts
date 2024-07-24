import { ToolFunction } from "../../../../types/chat";
import { executeSql } from "./executeSqlFunctionActions";

const name = "executeSql";

const description =
  "Execute a SQLite SQL statement against the database. Never mutate the database schema with this tool.";

const parameters = {
  type: "object",
  properties: {
    sql: {
      type: "string",
      description: "The SQL statement to execute",
    },
  },
  required: ["sql"],
};

async function run(params: any): Promise<string> {
  const rows: any[] = await executeSql(params.sql);
  if (rows.length === 0) {
    return "SQL query executed successfully. No data returned.";
  } else {
    return JSON.stringify(rows);
  }
}

export const executeSqlToolFunction: ToolFunction = {
  name: name,
  description: description,
  getParameters: async () => parameters,
  run: run,
};
