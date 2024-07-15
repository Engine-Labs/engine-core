import {
  MessageParam as ClaudeMessage,
  TextBlockParam as ClaudeTextBlock,
  ToolResultBlockParam as ClaudeToolResult,
  ToolUseBlockParam as ClaudeToolUse,
} from "@anthropic-ai/sdk/resources/messages.mjs";
import { Message } from "../../types/chat";

export function convertMessagesToClaudeMessages(
  messages: Message[]
): ClaudeMessage[] {
  let prevMessage: Message | undefined = undefined;
  let messagesToProcess: Message[] = [];
  let claudeMessages: ClaudeMessage[] = [];

  for (const message of messages) {
    if (prevMessage && prevMessage.role === "tool" && message.role === "tool") {
      messagesToProcess.push(message);
    } else {
      if (messagesToProcess.length > 0) {
        claudeMessages.push(convertMessageToClaudeMessage(messagesToProcess));
        messagesToProcess = [];
      }
      messagesToProcess.push(message);
    }
    prevMessage = message;
  }
  if (messagesToProcess.length > 0) {
    claudeMessages.push(convertMessageToClaudeMessage(messagesToProcess));
  }

  return claudeMessages;
}

export function convertMessageToClaudeMessage(
  messages: Message[]
): ClaudeMessage {
  const role = messages[0].role;

  switch (role) {
    case "user":
      return createClaudeUserMessage(messages[0]);
    case "assistant":
      return createClaudeAssistantMessage(messages[0]);
    case "tool":
      return createClaudeToolResponseMessage(messages);
    default:
      throw new Error(`Unknown role: ${role}`);
  }
}

function createClaudeUserMessage(message: Message): ClaudeMessage {
  return {
    role: "user",
    content: message.content,
  };
}

function createClaudeAssistantMessage(message: Message): ClaudeMessage {
  let contentBlock = [];

  let trimmedContent = message.content?.trim();

  if (trimmedContent) {
    const textContent: ClaudeTextBlock = {
      type: "text",
      text: message.content,
    };
    contentBlock.push(textContent);
  }

  let claudeToolCalls: ClaudeToolUse[] = [];
  if (message.tool_calls) {
    claudeToolCalls = message.tool_calls.map((toolCall) => {
      return {
        type: "tool_use",
        id: toolCall.id,
        name: toolCall.function.name,
        input: JSON.parse(toolCall.function.arguments),
      } as ClaudeToolUse;
    });
  }

  const content = [...contentBlock, ...claudeToolCalls];

  return {
    role: "assistant",
    content,
  };
}

function createClaudeToolResponseMessage(messages: Message[]): ClaudeMessage {
  const toolContent: ClaudeToolResult[] = messages.map((message) => {
    if (!message.tool_call_id) {
      throw new Error("Tool response message must have a tool_call_id");
    }

    return {
      type: "tool_result",
      tool_use_id: message.tool_call_id,
      content: [
        {
          type: "text",
          text: message.content,
        },
      ],
      is_error: message.is_error,
    };
  });

  return {
    role: "user",
    content: toolContent,
  };
}
