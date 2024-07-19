import { ToolFunction } from "../../../../types/chat";
import { killProcess } from "./killProcessFunctionAction";

const name = "killProcess";

// Description for the llm
const description = "Kill a background process in the project directory";

// JSON schema parameters for the this function
const parameters = {
  type: "object",
  properties: {
    name: {
      type: "string",
      description: "The name of the process which you can use to kill it later",
    },
  },
  required: ["name"],
};

// The function that will be called when this tool is invoked
// Accepts the parameters define here in JSON schema
// MUST return a string which clearly describes the result of the function
// whether it was successful or not
async function run(params: any): Promise<string> {
  await killProcess(params.name);

  return `Successfully killed the ${params.name} process`;
}

export const killProcessToolFunction: ToolFunction = {
  name: name,
  description: description,
  getParameters: async () => parameters,
  run: async (params: any) => {
    return await run(params);
  },
};
