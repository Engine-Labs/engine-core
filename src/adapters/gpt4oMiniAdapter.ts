import { OpenAIBaseAdapter } from "./openai/openaiAdapter";

export class Gpt4oMiniAdapter extends OpenAIBaseAdapter {
  constructor() {
    const modelName = "gpt-4o-mini";
    super(modelName);
  }
}
