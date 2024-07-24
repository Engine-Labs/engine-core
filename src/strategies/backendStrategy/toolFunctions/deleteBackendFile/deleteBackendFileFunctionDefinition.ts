import { ToolFunction } from "../../../../types/chat";
import { deleteBackendFile } from "./deleteBackendFileFunctionAction";

const name = "deleteBackendFile";

const description = "Delete a backend file in the project";

const parameters = {
  type: "object",
  properties: {
    filepath: {
      type: "string",
      description: `The full path to the backend file you want to delete, relative to the project root`,
    },
  },
  required: ["filepath"],
};

async function run(params: any): Promise<string> {
  await deleteBackendFile(params.filepath);

  return `Successfully deleted the backend file \`${params.filepath}\``;
}

export const deleteBackendFileToolFunction: ToolFunction = {
  name: name,
  description: description,
  getParameters: async () => parameters,
  run: run,
};
