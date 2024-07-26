import { appendFileSync } from "fs";
import nodeFetch from "node-fetch";
import OpenAI from "openai";
import type {
  ChatCompletionStream,
  ChatCompletionStreamParams,
} from "openai/lib/ChatCompletionStream";
import type { Readable } from "stream";

import { isChatCancelled } from "../../chatState";
import { callToolFunction } from "../../chatUtils";

import { CHAT_HISTORY_FILE, logger, OPENAI_API_KEY } from "../../constants";
import {
  ChatAdapter,
  ChatAdapterChatParams,
  ChatResponse,
  ChatStreamData,
  HistoryMessage,
  Message,
  ToolFunction,
} from "../../types/chat";

export class OpenAIBaseAdapter implements ChatAdapter {
  private _llmModel: string;
  runMessages: Message[] = [];

  constructor(llmModel: string) {
    this._llmModel = llmModel;
  }

  get llmModel(): string {
    return this._llmModel;
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

    const openai = new OpenAI({
      apiKey: OPENAI_API_KEY,
      // HACK: This is a workaround for a bug in the Bun runtime:
      //       https://github.com/oven-sh/bun/issues/9429
      // @ts-ignore
      fetch: nodeFetch,
    });

    const toolParams = await this.generateToolParams(tools);

    let openAiStream: ChatCompletionStream;
    let openAiChatParams: ChatCompletionStreamParams = {
      model: this.llmModel,
      messages: messages as OpenAI.Chat.Completions.ChatCompletionMessage[],
      stream: true,
      stream_options: {
        include_usage: true,
      },
    };

    if (toolParams.length > 0) {
      openAiChatParams.tools = toolParams;
      openAiChatParams.parallel_tool_calls = false;
    }

    openAiStream = openai.beta.chat.completions.stream(openAiChatParams);
    const streamingToolCallNames: Record<string, string> = {};

    for await (const chunk of openAiStream) {
      if (isChatCancelled()) {
        return this.handleCancellation(messages);
      }

      const transformedChunk = this.transformChunk(
        chunk,
        streamingToolCallNames
      );
      if (transformedChunk) {
        const transformedChunkString = JSON.stringify(transformedChunk) + "\n";
        stream.push(transformedChunkString);
      }
    }

    const completion = await openAiStream.finalChatCompletion();

    const newMessage = completion.choices[0].message as Message;
    messages.push(newMessage);
    this.saveMessageToChatHistory(newMessage);

    return { messages, lastCompletion: newMessage };
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
    const toolParams: OpenAI.Chat.Completions.ChatCompletionTool[] = [];
    for (const tool of tools) {
      toolParams.push({
        type: "function",
        function: {
          name: tool.name,
          description: tool.description,
          parameters: await tool.getParameters(),
        },
      });
    }
    logger.debug(`Tool params: ${JSON.stringify(toolParams)}`);
    return toolParams;
  }

  // Stream must return deltas as ChatStreamData objects
  private transformChunk(
    chunk: any,
    streamingToolCallNames: Record<string, string>
  ): ChatStreamData | null {
    if (chunk.choices.length === 0) {
      return null;
    }

    const choice = chunk.choices[0];
    const delta = choice.delta;

    switch (choice.finish_reason) {
      case "stop":
        delete streamingToolCallNames[chunk.id];
        return null;
      case "tool_calls":
        // TODO: I think this is a noop
        return null;
      case null:
        return this.handleContinueReason(chunk, delta, streamingToolCallNames);
      default:
        logger.warn(
          `Unexpected finish reason: ${
            choice.finish_reason
          } for chunk: ${JSON.stringify(chunk)}`
        );
        return null;
    }
  }

  private handleContinueReason(
    chunk: any,
    delta: any,
    streamingToolCallNames: Record<string, string>
  ): ChatStreamData | null {
    if (delta?.content) {
      return this.buildChatData(chunk, delta.content);
    }

    if (delta?.tool_calls && delta.tool_calls.length > 0) {
      return this.handleToolCall(
        chunk,
        delta.tool_calls[0],
        streamingToolCallNames
      );
    }

    // HACK: Ignore empty content from assistant
    if (delta?.role === "assistant" && !delta?.content) {
      return null;
    }

    logger.warn(`Unknown delta format: ${JSON.stringify(delta)}`);
    return null;
  }

  private buildChatData(chunk: any, content: string): ChatStreamData {
    return {
      id: chunk.id,
      type: "chat",
      chat: { content: content },
    };
  }

  private handleToolCall(
    chunk: any,
    toolCall: any,
    streamingToolCallNames: Record<string, string>
  ): ChatStreamData {
    const toolContent = toolCall.function.arguments;
    streamingToolCallNames[chunk.id] = toolCall.function.name;
    return {
      id: chunk.id,
      type: "tool",
      tool: {
        name: toolCall.function.name,
        content: toolContent,
      },
    };
  }
}
