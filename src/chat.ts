import { getCompleteChatHistory } from "./chatUtils";
import type {
  ChatAdapterChatParams,
  ChatParams,
  ChatResponse,
  Message,
} from "./types/chat";

export async function chat({
  userMessage: userMessage,
  chatAdapter: chatAdapter,
  chatStrategy: chatStrategy,
  stream: stream,
}: ChatParams): Promise<void> {
  // Save the incoming user message to the chat history
  chatAdapter.saveMessageToChatHistory(userMessage);
  const completeChatHistory = getCompleteChatHistory();
  const chatHistory: Message[] =
    chatStrategy.getChatHistory(completeChatHistory);
  let chatParams: ChatAdapterChatParams = await chatStrategy.call(
    chatHistory,
    []
  );

  try {
    let chatResponse: ChatResponse = await chatAdapter.chat(
      chatParams,
      stream,
      chatStrategy
    );

    while (
      chatResponse.lastCompletion &&
      chatAdapter.isToolCall(chatResponse.lastCompletion)
    ) {
      // allow tool call messages to be processed when the chat is cancelled
      const toolCallResponseMessages: Message[] =
        await chatAdapter.toolCallResponseMessages(
          chatResponse.lastCompletion,
          chatParams.tools
        );

      chatParams = await chatStrategy.call(
        chatResponse.messages,
        toolCallResponseMessages
      );

      chatResponse = await chatAdapter.chat(chatParams, stream, chatStrategy);
    }
    await chatStrategy.onRunComplete(chatAdapter.runMessages);
  } catch (error) {
    throw error;
  }
}