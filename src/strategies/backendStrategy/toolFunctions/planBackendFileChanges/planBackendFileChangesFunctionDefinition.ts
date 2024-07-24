import { ToolFunction } from "../../../../types/chat";
import { planBackendFileChanges } from "./planBackendFileChangesFunctionAction";

const name = "planBackendFileChanges";

const description =
  "Use when you want to create a new backend file or make changes to an existing backend file.";

const parameters = {
  type: "object",
  properties: {
    filepath: {
      type: "string",
      description: `The path to the file, relative to the project root, e.g. src/endpoints/healthcheck.ts`,
    },
    detailedDescription: {
      type: "string",
      description:
        "A detailed description of the purpose and functionality of the file, or changes you would like to make to this file.",
    },
  },
  required: ["filepath", "detailedDescription"],
};

async function run(params: any): Promise<string> {
  return await planBackendFileChanges(
    params.filepath,
    params.detailedDescription
  );
}

export const planBackendFileChangesToolFunction: ToolFunction = {
  name: name,
  description: description,
  getParameters: async () => parameters,
  run: run,
};
