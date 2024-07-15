import { ClaudeBaseAdapter } from "./claude/claudeBaseAdapter";

export class ClaudeOpusAdapter extends ClaudeBaseAdapter {
  llmModel() {
    return "claude-3-opus-20240229";
  }
}
