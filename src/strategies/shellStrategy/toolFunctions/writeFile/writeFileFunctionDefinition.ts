import { ToolFunction } from "../../../../types/chat";
import { writeFile } from "./writeFileFunctionAction";

const name = "writeFile";

const description = "Write the contents to a file in the project";

const parameters = {
  type: "object",
  properties: {
    filepath: {
      type: "string",
      description:
        "The full path to the file you want to write, relative to the project root",
    },
    content: {
      type: "string",
      description: "The content you want to write to the file",
    },
  },
  required: ["filepath", "content"],
};

async function run(params: any): Promise<string> {
  writeFile(params.filepath, params.content);

  return `Successfully wrote to the file \`${params.filepath}\``;
}

export const writeFileToolFunction: ToolFunction = {
  name: name,
  description: description,
  getParameters: async () => parameters,
  run: run,
};
