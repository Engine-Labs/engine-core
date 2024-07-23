import {
  MessageParam as ClaudeMessage,
  TextBlockParam as ClaudeTextBlock,
} from "@anthropic-ai/sdk/resources/messages.mjs";
import { ChatCompletionMessageToolCall as OpenAiToolCall } from "openai/resources/chat/completions";
import { Message } from "../../types/chat";

export function convertClaudeMessageToMessage(
  claudeMessage: ClaudeMessage
): Message {
  const role = claudeMessage.role;

  switch (role) {
    case "user":
      return createUserMessages(claudeMessage);
    case "assistant":
      return createAssistantMessages(claudeMessage);
    default:
      throw new Error(`Unknown role: ${role}`);
  }
}

function createUserMessages(claudeMessage: ClaudeMessage): Message {
  if (typeof claudeMessage.content === "string") {
    return { role: "user", content: claudeMessage.content };
  }

  if (claudeMessage.content[0].type === "tool_result") {
    const firstContentBlock = claudeMessage.content[0];
    const textBlock = firstContentBlock.content as ClaudeTextBlock[];
    const toolResponseText = textBlock[0].text;

    return {
      role: "tool",
      content: toolResponseText,
      tool_call_id: claudeMessage.content[0].tool_use_id,
      is_error: firstContentBlock.is_error,
    };
  } else {
    throw new Error(
      `Unknown claudeMessage type in createUserMessages: ${claudeMessage}`
    );
  }
}

function createAssistantMessages(claudeMessage: ClaudeMessage): Message {
  if (typeof claudeMessage.content === "string") {
    return { role: "assistant", content: claudeMessage.content.trim() };
  }

  let textContent = "";
  let toolCalls: OpenAiToolCall[] = [];

  for (const content of claudeMessage.content) {
    switch (content.type) {
      case "text":
        textContent = content.text;
        break;
      case "tool_use":
        toolCalls.push({
          id: content.id,
          type: "function",
          function: {
            name: content.name,
            arguments: JSON.stringify(content.input),
          },
        });
        break;
      default:
        throw new Error(`Unknown content type`);
    }
  }

  const assistantMessage: Message = {
    role: "assistant",
    content: textContent.trim(),
  };

  if (toolCalls.length > 0) {
    assistantMessage.tool_calls = toolCalls;
  }

  return assistantMessage;
}
