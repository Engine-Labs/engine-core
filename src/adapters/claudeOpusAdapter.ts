import { ClaudeBaseAdapter } from "./claude/claudeBaseAdapter";

export class ClaudeOpusAdapter extends ClaudeBaseAdapter {
  constructor() {
    const modelName = "claude-3-opus-20240229";
    const maxOutputTokens = 4096;

    super(modelName, maxOutputTokens);
  }
}
