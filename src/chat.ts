import { endChatState, setChatInProgress } from "./chatState";
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
  chatAdapter.saveMessageToChatHistory(userMessage);
  const completeChatHistory = getCompleteChatHistory();
  const chatHistory: Message[] =
    chatStrategy.getChatHistory(completeChatHistory);

  let chatParams: ChatAdapterChatParams = await chatStrategy.call(
    chatHistory,
    []
  );

  try {
    setChatInProgress();
    let chatResponse: ChatResponse = await chatAdapter.chat(
      chatParams,
      stream,
      chatStrategy
    );

    while (
      chatResponse.lastCompletion &&
      chatAdapter.isToolCall(chatResponse.lastCompletion)
    ) {
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
  } finally {
    endChatState();
  }
}
