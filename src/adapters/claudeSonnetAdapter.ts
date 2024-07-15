import { ClaudeBaseAdapter } from "./claude/claudeBaseAdapter";

export class ClaudeSonnetAdapter extends ClaudeBaseAdapter {
  llmModel() {
    return "claude-3-5-sonnet-20240620";
  }
}
