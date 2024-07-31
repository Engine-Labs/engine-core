import { logger } from "../../../../constants";
import { ToolFunction } from "../../../../types/chat";
import { shellExec } from "./shellExecFunctionAction";

const name = "shellExec";

const description = "Run any shell command in the project directory";

const parameters = {
  type: "object",
  properties: {
    command: {
      type: "string",
      description:
        "The full shell command you wish to run in the project directory with flags e.g. `find . -type d -name target -prune -o -print`",
    },
  },
  required: ["command"],
};

async function run(params: any): Promise<string> {
  const result = await shellExec(params.command);

  logger.info(`Shell command results: ${result}`);

  return `Successfully ran shell command: ${result}`;
}

export const shellExecToolFunction: ToolFunction = {
  name: name,
  description: description,
  getParameters: async () => parameters,
  run: run,
};
