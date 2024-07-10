import { ToolFunction } from "../../../../types/chat";
import { writeBackendFile } from "./writeBackendFileFunctionAction";

const name = "writeBackendFileWithContent";

const description =
  "Write a file in the API directory with the provided content";

const parameters = {
  type: "object",
  properties: {
    filepath: {
      type: "string",
      description: `The path to the file you want to write, relative to the project root, e.g. src/endpoints/healthcheck.ts`,
    },
    content: {
      type: "string",
      description: "The content you want to write to the file",
    },
  },
  required: ["filepath", "content"],
};

async function run(params: any): Promise<string> {
  if (!params.content) {
    throw new Error("File content is required for writeBackendFile");
  }

  await writeBackendFile(params.filepath, params.content);

  return `Successfully wrote to the API file \`${params.filepath}\``;
}

export const writeBackendFileToolFunction: ToolFunction = {
  name: name,
  description: description,
  getParameters: async () => parameters,
  run: run,
};
