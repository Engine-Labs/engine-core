import Anthropic from "@anthropic-ai/sdk";
import { RequestOptions } from "@anthropic-ai/sdk/core.mjs";
import { MessageStreamParams } from "@anthropic-ai/sdk/resources/messages.mjs";
import { appendFileSync } from "fs";
import type { Readable } from "stream";

import { isChatCancelled } from "../../chatState";
import { callToolFunction } from "../../chatUtils";
import { ANTHROPIC_API_KEY, CHAT_HISTORY_FILE, logger } from "../../constants";
import type {
  ChatAdapter,
  ChatAdapterChatParams,
  ChatResponse,
  ChatStreamData,
  HistoryMessage,
  Message,
  ToolFunction,
} from "../../types/chat";
import { convertClaudeMessageToMessage } from "./claudeMessageToMessage";
import { convertMessagesToClaudeMessages } from "./messageToClaudeMessage";
export class ClaudeBaseAdapter implements ChatAdapter {
  private _llmModel: string;
  private _maxOutputTokens: number;
  private _requestOptions: RequestOptions;

  runMessages: Message[] = [];

  currentMessageId: string = "";
  currentToolCallId: string = "";
  currentToolCallFunctionName: string = "";

  constructor(
    llmModel: string,
    maxOutputTokens: number,
    requestOptions?: RequestOptions
  ) {
    this._llmModel = llmModel;
    this._maxOutputTokens = maxOutputTokens;
    this._requestOptions = requestOptions || {};
  }

  get llmModel(): string {
    return this._llmModel;
  }

  get maxOutputTokens(): number {
    return this._maxOutputTokens;
  }

  get requestOptions(): RequestOptions {
    return this._requestOptions;
  }

  isToolCall(message: Message): boolean {
    return message.tool_calls !== undefined && message.tool_calls.length > 0;
  }

  async toolCallResponseMessages(
    message: Message,
    tools: ToolFunction[]
  ): Promise<Message[]> {
    if (!message.tool_calls) {
      throw new Error("No tool calls found in the last message");
    }

    const toolCallResponseMessages: Message[] = [];

    for (const toolCall of message.tool_calls) {
      const toolName = toolCall.function.name;
      logger.debug(`Responding to tool call: ${toolName}`);

      let toolFunctionParams: any;
      try {
        toolFunctionParams = JSON.parse(toolCall.function.arguments);
      } catch (error) {
        logger.error(
          `${error} - failed to parse tool call: ${toolCall.function.arguments}`
        );
        toolCallResponseMessages.push({
          role: "tool",
          content: `Failed to parse tool call as JSON: ${toolCall.function.arguments}`,
          tool_call_id: toolCall.id,
        });
        continue;
      }

      const toolCallResponse = await callToolFunction(
        toolName,
        toolFunctionParams,
        tools
      );

      const message = {
        role: "tool",
        content: toolCallResponse.responseText,
        tool_call_id: toolCall.id,
        is_error: toolCallResponse.isError,
      } as Message;

      toolCallResponseMessages.push(message);
      this.saveMessageToChatHistory(message);
    }

    logger.debug(
      `Tool call responses: ${JSON.stringify(toolCallResponseMessages)}`
    );

    return toolCallResponseMessages;
  }

  handleCancellation(messages: Message[]): ChatResponse {
    const cancellationMessage: Message = {
      role: "assistant",
      content: "Chat cancelled",
    };
    messages.push(cancellationMessage);
    this.saveMessageToChatHistory(cancellationMessage);
    return { messages, lastCompletion: cancellationMessage };
  }

  async chat(
    { messages, tools }: ChatAdapterChatParams,
    stream: Readable
  ): Promise<ChatResponse> {
    if (isChatCancelled()) {
      return this.handleCancellation(messages);
    }

    const anthropic = new Anthropic({
      apiKey: ANTHROPIC_API_KEY,
    });

    const toolParams = await this.generateToolParams(tools);

    const systemPrompt = messages
      .filter((message) => message.role === "system")
      .map((message) => message.content)
      .join("\n");

    messages = messages.filter((message) => message.role !== "system");

    const claudeMessages = convertMessagesToClaudeMessages(messages);

    let claudeChatParams: MessageStreamParams = {
      max_tokens: this.maxOutputTokens,
      model: this.llmModel,
      messages: claudeMessages,
      stream: true,
    };

    if (toolParams.length > 0) {
      claudeChatParams.tools = toolParams;
    }

    if (systemPrompt) {
      claudeChatParams.system = systemPrompt;
    }

    const requestOptions: RequestOptions = this.requestOptions;

    const claudeStream = anthropic.messages.stream(
      claudeChatParams,
      requestOptions
    );
    const streamingToolCallNames: Record<string, string> = {};

    for await (const chunk of claudeStream) {
      if (isChatCancelled()) {
        claudeStream.abort();
        return this.handleCancellation(messages);
      }
      const transformedChunk = this.transformChunk(
        chunk,
        streamingToolCallNames
      );
      const transformedChunkString = JSON.stringify(transformedChunk) + "\n";
      if (transformedChunk) {
        stream.push(transformedChunkString);
      }
    }

    const finalMessage = await claudeStream.finalMessage();

    const assistantResponseMessage =
      convertClaudeMessageToMessage(finalMessage);

    messages.push(assistantResponseMessage);
    this.saveMessageToChatHistory(assistantResponseMessage);

    return { messages, lastCompletion: assistantResponseMessage };
  }

  saveMessageToChatHistory(message: Message): void {
    this.runMessages.push(message);
    const messageWithTimestamp: HistoryMessage = {
      ...message,
      timestamp: new Date().toISOString(),
    };

    appendFileSync(
      CHAT_HISTORY_FILE,
      JSON.stringify(messageWithTimestamp) + "\n"
    );
  }

  private async generateToolParams(tools: ToolFunction[]) {
    const toolParams: Anthropic.Messages.Tool[] = [];
    for (const tool of tools) {
      toolParams.push({
        name: tool.name,
        description: tool.description,
        input_schema: {
          name: tool.name,
          type: "object",
          description: tool.description,
          parameters: await tool.getParameters(),
        },
      });
    }
    logger.debug(`Tool params: ${JSON.stringify(toolParams)}`);
    return toolParams;
  }

  private transformChunk(
    chunk: any,
    streamingToolCallNames: Record<string, string>
  ): ChatStreamData | null {
    const event = chunk.type;

    switch (event) {
      case "message_start":
        this.currentMessageId = chunk.message.id;
        return null;
      case "content_block_start":
        if (chunk.content_block.type === "tool_use") {
          this.currentToolCallId = chunk.content_block.id;
          this.currentToolCallFunctionName = chunk.content_block.name;
        }
        return null;
      case "content_block_stop":
      case "message_stop":
        delete streamingToolCallNames[chunk.id];
        return null;
      case "message_delta":
        if (chunk.delta.stop_reason === "tool_use") {
        }
        delete streamingToolCallNames[chunk.id];
        return null;
      case "ping":
        return null;
      case "content_block_delta":
        if (this.currentMessageId) {
          return this.handleContinueReason(
            this.currentMessageId,
            chunk,
            streamingToolCallNames,
            this.currentToolCallId,
            this.currentToolCallFunctionName
          );
        } else {
          logger.warn(`No messageId for chunk: ${JSON.stringify(chunk)}`);
          return null;
        }
      default:
        logger.warn(
          `Unexpected event: ${event}
           for chunk: ${JSON.stringify(chunk)}`
        );
        return null;
    }
  }

  private handleContinueReason(
    messageId: string,
    chunk: any,
    streamingToolCallNames: Record<string, string>,
    toolCallId?: string,
    toolCallFunctionName?: string
  ): ChatStreamData | null {
    if (chunk.delta.type === "text_delta") {
      return this.buildChatData(messageId, chunk);
    }

    if (chunk.delta.type === "input_json_delta") {
      if (toolCallFunctionName && toolCallId) {
        return this.handleToolCall(
          toolCallFunctionName,
          toolCallId,
          chunk,
          streamingToolCallNames
        );
      } else {
        logger.warn(
          `Tool call data found without function name or id: ${JSON.stringify(
            chunk
          )}`
        );
        return null;
      }
    }

    logger.warn(`Unknown delta format: ${JSON.stringify(chunk)}`);
    return null;
  }

  private buildChatData(messageId: string, chunk: any): ChatStreamData {
    return {
      id: messageId,
      type: "chat",
      chat: { content: chunk.delta.text },
    };
  }

  private handleToolCall(
    toolCallFunctionName: string,
    toolCallId: string,
    chunk: any,
    streamingToolCallNames: Record<string, string>
  ): ChatStreamData {
    streamingToolCallNames[toolCallId] = toolCallFunctionName;
    return {
      id: toolCallId,
      type: "tool",
      tool: {
        name: toolCallFunctionName,
        content: chunk.delta.partial_json,
      },
    };
  }
}
