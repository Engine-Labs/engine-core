import { ToolFunction } from "../../../../types/chat";
import { runProcess } from "./runProcessFunctionAction";

const name = "runProcess";

const description = "Run a process in the project directory in the background";

const parameters = {
  type: "object",
  properties: {
    name: {
      type: "string",
      description: "The name of the process which you can use to stop it later",
    },
    command: {
      type: "string",
      description:
        "The full shell command to run the process with flags e.g. `npm run dev`",
    },
  },
  required: ["name", "command"],
};

async function run(params: any): Promise<string> {
  runProcess(params.name, params.command);

  return `App is running`;
}

export const runProcessToolFunction: ToolFunction = {
  name: name,
  description: description,
  getParameters: async () => parameters,
  run: run,
};
