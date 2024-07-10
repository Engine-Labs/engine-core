import { OpenAIBaseAdapter } from "./openai/openaiAdapter";

export class Gpt4oAdapter extends OpenAIBaseAdapter {
  constructor() {
    const modelName = "gpt-4o";
    super(modelName);
  }
}
