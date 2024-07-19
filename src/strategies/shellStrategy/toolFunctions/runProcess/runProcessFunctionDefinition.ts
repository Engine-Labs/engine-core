import { ToolFunction } from "../../../../types/chat";
import { runProcess } from "./runProcessFunctionAction";

const name = "runProcess";

// Description for the llm
const description = "Run a blocking process in the background";

// JSON schema parameters for the this function
const parameters = {
  type: "object",
  properties: {
    name: {
      type: "string",
      description:
        "The name of the blocking process which you can use to stop it later",
    },
    command: {
      type: "string",
      description:
        "The full shell command to run the process with flags e.g. `npm run dev`",
    },
  },
  required: ["name", "command"],
};

// The function that will be called when this tool is invoked
// Accepts the parameters define here in JSON schema
// MUST return a string which clearly describes the result of the function
// whether it was successful or not
async function run(params: any): Promise<string> {
  runProcess(params.name, params.command);

  return `${params.name} is running`;
}

export const runProcessToolFunction: ToolFunction = {
  name: name,
  description: description,
  getParameters: async () => parameters,
  run: async (params: any) => {
    return await run(params);
  },
};
