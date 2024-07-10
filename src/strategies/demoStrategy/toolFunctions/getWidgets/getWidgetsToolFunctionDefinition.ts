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
  const fruits: string[] = getWidgets(params.colour);

  if (fruits.length === 0) {
    return `No ${params.colour} fruits found`;
  }

  return `${params.colour} fruits: ${fruits.join(", ")}`;
}

export const getWidgetsToolFunction: ToolFunction = {
  name: name,
  description: description,
  getParameters: async () => parameters,
  run: async (params: any) => {
    return await run(params);
  },
};
