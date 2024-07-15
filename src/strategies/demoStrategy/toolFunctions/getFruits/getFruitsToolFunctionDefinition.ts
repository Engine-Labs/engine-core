import { logger } from "../../../../constants";
import { ToolFunction } from "../../../../types/chat";
import { getFruits } from "./getFruitsToolFunctionAction";

const name = "getFruits";

// Description for the llm
const description = "Get fruits of a specific colour";

// JSON schema parameters for the this function
const parameters = {
  type: "object",
  properties: {
    colour: {
      type: "string",
      description: "The colour of the desired fruit",
    },
  },
  required: ["colour"],
};

// This is a string that describes the context in which the tool will be run
const staticContext = "noop";

// The function that will be called when this tool is invoked
// Accepts the parameters define here in JSON schema
// MUST return a string which clearly describes the result of the function
// whether it was successful or not
async function run(params: any): Promise<string> {
  const result = getFruits(params.colour);

  return `Selected fruits are  \`${result}\``;
}

export const getFruitsToolFunction: ToolFunction = {
  name: name,
  description: description,
  staticContext: staticContext,
  getParameters: async () => parameters,
  run: async (params: any) => {
    try {
      return await run(params);
    } catch (e) {
      logger.error("Error in getFruitsToolFunction type:", e);
      return "An unexpected error occurred";
    }
  },
};
