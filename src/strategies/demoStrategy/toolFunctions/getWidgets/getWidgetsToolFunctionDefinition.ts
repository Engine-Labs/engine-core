import { ToolFunction } from "../../../../types/chat";
import { getWidgets } from "./getWidgetsToolFunctionAction";

const name = "getWidgets";

// Description for the llm
const description = "Return a list of widgets of a given colour";

// JSON schema parameters for the this function
const parameters = {
  type: "object",
  properties: {
    colour: {
      type: "string",
      description: "The colour of the desired widgets",
    },
  },
  required: ["colour"],
};

// The function that will be called when this tool is invoked
// It accepts the parameters define here in JSON schema
// It MUST return a string which clearly describes the result of the function whether it was successful or not
async function run(params: any): Promise<string> {
  const widgets: string[] = getWidgets(params.colour);

  if (widgets.length === 0) {
    return `No ${params.colour} widgets found`;
  }

  return `${params.colour} widgets: ${widgets.join(", ")}`;
}

export const getWidgetsToolFunction: ToolFunction = {
  name: name,
  description: description,
  getParameters: async () => parameters,
  run: async (params: any) => {
    return await run(params);
  },
};
