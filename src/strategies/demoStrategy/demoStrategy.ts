import { logger, MAX_TOOL_CALL_ITERATIONS } from "../../constants";
import type {
  ChatAdapterChatParams,
  ChatStrategy,
  Message,
  ToolFunction,
} from "../../types/chat";
import { getWidgetsToolFunction } from "./toolFunctions/getWidgets/getWidgetsToolFunctionDefinition";

export class DemoStrategy implements ChatStrategy {
  toolFunctions = [getWidgetsToolFunction];

  async init() {
    return;
  }

  toolFunctionMap() {
    return Object.fromEntries(
      this.toolFunctions.map((toolFunction) => [
        toolFunction.name,
        toolFunction,
      ])
    );
  }

  getToolFunctionByName(toolFunctionName: string) {
    return (
      this.toolFunctions.find(
        (toolFunction) => toolFunction.name === toolFunctionName
      ) ?? null
    );
  }

  async onRunComplete(_messages: Message[]): Promise<void> {
    return;
  }

  callCount: number = 0;

  async call(
    messages: Message[],
    toolCallResponses: Message[]
  ): Promise<ChatAdapterChatParams> {
    // this basic implementation just returns the vanilla system prompt, messages, and tools
    // i.e. attempts nothing dynamic, a standard continuous chat

    let tools = this.getTools();
    if (this.callCount >= MAX_TOOL_CALL_ITERATIONS) {
      logger.info(`Maximum iterations reached: ${this.callCount}`);
      const lastToolCallResponse =
        toolCallResponses[toolCallResponses.length - 1];
      lastToolCallResponse.content +=
        "\nYou've reached the maximum number of tool calls, do not call any more tools now. Do not apologise to the user, update them with progress and check if they wish to continue";
    }

    // If the first message is not the system prompt then prepend it
    if (!messages[0] || messages[0].role !== "system") {
      const systemPromptMessage: Message = {
        role: "system",
        content: this.getSystemPrompt(),
      };
      messages.unshift(systemPromptMessage);
    }

    this.callCount += 1;

    return {
      messages: [...messages, ...toolCallResponses],
      tools: tools,
    };
  }

  getChatHistory(completeHistory: Message[]): Message[] {
    return completeHistory;
  }

  private getTools(): ToolFunction[] {
    return this.toolFunctions;
  }

  private getSystemPrompt() {
    return `You are a helpful assistant`;
  }
}
