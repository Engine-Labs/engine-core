import { setChatStatus } from "./chatStatus";
import { getCompleteChatHistory } from "./chatUtils";
import type {
  ChatAdapterChatParams,
  ChatParams,
  ChatResponse,
  Message,
} from "./types/chat";

export async function chat({
  message: message,
  stream: stream,
  chatAdapter: chatAdapter,
  chatStrategy: chatStrategy,
}: ChatParams): Promise<void> {
  // Save the incoming user message to the chat history
  chatAdapter.saveMessageToChatHistory(message);
  const completeChatHistory = getCompleteChatHistory();
  const chatHistory: Message[] =
    chatStrategy.getChatHistory(completeChatHistory);
  let chatParams: ChatAdapterChatParams = await chatStrategy.call(
    chatHistory,
    []
  );

  try {
    setChatStatus("Generating response...");
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
      setChatStatus("Handling tool calls...");
      const toolCallResponseMessages: Message[] =
        await chatAdapter.toolCallResponseMessages(
          chatResponse.lastCompletion,
          chatParams.tools
        );
      chatParams = await chatStrategy.call(
        chatResponse.messages,
        toolCallResponseMessages
      );

      setChatStatus("Generating response...");
      chatResponse = await chatAdapter.chat(chatParams, stream, chatStrategy);
    }
    setChatStatus("Finishing up...");
    await chatStrategy.onRunComplete(chatAdapter.runMessages);
  } catch (error) {
    throw error;
  }
}
