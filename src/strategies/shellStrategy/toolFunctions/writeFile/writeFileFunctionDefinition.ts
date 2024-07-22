import { ToolFunction } from "../../../../types/chat";
import { writeFile } from "./writeFileFunctionAction";

const name = "writeFile";

// Description for the llm
const description = "Write code to a file in the project";

// JSON schema parameters for the this function
const parameters = {
  type: "object",
  properties: {
    code: {
      type: "string",
      description: "The code you want to write to the file",
    },
    filepath: {
      type: "string",
      description:
        "The full path to the file you want to write, relative to the project root",
    },
  },
  required: ["code", "filepath"],
};

// The function that will be called when this tool is invoked
// Accepts the parameters define here in JSON schema
// MUST return a string which clearly describes the result of the function
// whether it was successful or not
async function run(params: any): Promise<string> {
  writeFile(params.filepath, params.code);

  return `Successfully wrote to the file \`${params.filepath}\``;
}

export const writeFileToolFunction: ToolFunction = {
  name: name,
  description: description,
  getParameters: async () => parameters,
  run: async (params: any) => {
    return await run(params);
  },
};
