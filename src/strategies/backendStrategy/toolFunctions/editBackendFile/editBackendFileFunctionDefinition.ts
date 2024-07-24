import { ToolFunction } from "../../../../types/chat";
import { editBackendFile } from "./editBackendFileFunctionAction";

const name = "editBackendFile";

const description =
  "Edit the contents of a file in the API directory by replacing the specified lines with the provided content. Line numbers are 1-indexed, and inclusive - e.g. to replace line 10, use editStartLine=10 and editEndLine=10.";

const parameters = {
  type: "object",
  properties: {
    filepath: {
      type: "string",
      description: `The path to the file you want to edit, relative to the project root, e.g. src/endpoints/healthcheck.ts`,
    },
    editStartLine: {
      type: "number",
      description: "The line number to start replacing from",
    },
    editEndLine: {
      type: "number",
      description: "The line number to end replacing at",
    },
    content: {
      type: "string",
      description:
        "The content you want to write to the file that will replace the existing content",
    },
  },
  required: ["filepath", "editStartLine", "editEndLine", "content"],
};

async function run(params: any): Promise<string> {
  await editBackendFile(
    params.filepath,
    params.editStartLine,
    params.editEndLine,
    params.content
  );

  return `Successfully edited lines ${params.editStartLine}-${params.editEndLine} in the API file \`${params.filepath}\``;
}

export const editBackendFileToolFunction: ToolFunction = {
  name: name,
  description: description,
  getParameters: async () => parameters,
  run: run,
};
