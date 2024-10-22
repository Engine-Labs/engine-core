import { type Readable } from "stream";

export type LastCompletion = Message | null;

export type ChatResponse = {
  messages: Message[];
  lastCompletion: LastCompletion;
};

export type Message = {
  role: string;
  content: string;
  tool_call_id?: string;
  tool_calls?: any[];
  is_error?: boolean;
};

export type HistoryMessage = Message & {
  timestamp?: string;
};

export type ChatParams = {
  userMessage: Message;
  chatAdapter: ChatAdapter;
  chatStrategy: ChatStrategy;
  stream: Readable;
};

export type CallToolFunctionParams = {
  toolFunctionName: string;
  toolFunctionParams: any;
};

export type ChatStreamData = {
  id: string;
  type: "chat" | "tool";
  chat?: {
    content: string;
  };
  tool?: {
    name: string;
    content: string;
  };
};

interface ToolFunctionRunner {
  (params: any): Promise<string>;
}

interface GetFunctionParameters {
  (): Promise<any>;
}
export interface ToolFunction {
  name: string;
  description: string;
  getParameters: GetFunctionParameters;
  requiredEnvVars?: string[];
  run: ToolFunctionRunner;
}

export interface ToolFunctionResponse {
  responseText: string;
  isError: boolean;
}

export interface ChatAdapter {
  runMessages: Message[];
  llmModel: string;
  maxOutputTokens?: number;
  requestOptions?: {};
  isToolCall(message: Message): boolean;
  toolCallResponseMessages(
    message: Message,
    tools: ToolFunction[]
  ): Promise<Message[]>;
  chat(
    { messages, tools }: ChatAdapterChatParams,
    stream: Readable,
    chatStrategy: ChatStrategy
  ): Promise<ChatResponse>;
  saveMessageToChatHistory(message: Message): void;
  handleCancellation(messages: Message[]): ChatResponse;
}

export type ChatAdapterChatParams = {
  messages: Message[];
  tools: ToolFunction[];
};

export type LastToolCall = {
  name: string | null;
  success: boolean;
};

export interface ChatStrategy {
  toolFunctions: ToolFunction[];
  call(
    messages: Message[],
    toolCallResponses: Message[]
  ): Promise<ChatAdapterChatParams>;
  toolFunctionMap(): { [key: string]: ToolFunction };
  getToolFunctionByName(toolFunctionName: string): ToolFunction | null;
  onRunComplete(messages: Message[]): Promise<void>;
  getChatHistory(completeHistory: HistoryMessage[]): Message[];
  init(): Promise<void>;
}

export type ChatState = {
  inProgress: boolean;
  cancelled: boolean;
  lastSuccessfulToolCall: string | null;
  lastToolCall: LastToolCall;
  perRunToolErrorCount: number;
};

export type ChatAdapterConstructor = new (...args: any[]) => ChatAdapter;
export type ChatStrategyConstructor = new (...args: any[]) => ChatStrategy;

export type BackendStrategySystemPromptVars = {
  apiFileTree: string;
  openApiDocument: string;
  databaseSchema: string;
};
