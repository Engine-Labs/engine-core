import { RequestOptions } from "@anthropic-ai/sdk/core.mjs";
import { ClaudeBaseAdapter } from "./claude/claudeBaseAdapter";

export class ClaudeSonnetAdapter extends ClaudeBaseAdapter {
  constructor() {
    const modelName = "claude-3-5-sonnet-20240620";
    const maxOutputTokens = 8192;
    const requestOptions: RequestOptions = {
      headers: {
        "anthropic-beta": "max-tokens-3-5-sonnet-2024-07-15",
      },
    };

    super(modelName, maxOutputTokens, requestOptions);
  }
}
