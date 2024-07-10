import Ajv from "ajv";
import { existsSync, readFileSync } from "fs";
import { readdirSync } from "fs-extra";
import { setLastToolCall } from "./chatState";
import { CHAT_HISTORY_FILE, logger } from "./constants";
import type {
  HistoryMessage,
  ToolFunction,
  ToolFunctionResponse,
} from "./types/chat";

const ajv = new Ajv();

export async function callToolFunction(
  toolFunctionName: string,
  toolFunctionParams: any,
  tools: ToolFunction[]
): Promise<ToolFunctionResponse> {
  const tool = tools.find((tool) => tool.name === toolFunctionName);

  if (!tool) {
    return {
      responseText: `You do not currently have access to the tool: ${toolFunctionName}. Your currently available tools are: ${tools
        .map((tool) => tool.name)
        .join(", ")}`,
      isError: true,
    };
  }

  const validate = ajv.compile(await tool.getParameters());
  const valid = validate(toolFunctionParams);
  if (!valid) {
    return {
      responseText: `Invalid parameters provided for tool ${toolFunctionName}. Check the parameters and try again. The errors are: ${JSON.stringify(
        validate.errors
      )}`,
      isError: true,
    };
  }

  logger.info(
    `Calling tool function ${toolFunctionName} with params: ${JSON.stringify(
      toolFunctionParams
    )}`
  );

  let responseText: string;
  try {
    responseText = await tool.run(toolFunctionParams);
    setLastToolCall(toolFunctionName, true);
  } catch (error) {
    setLastToolCall(toolFunctionName, false);
    if (error instanceof Error) {
      return { responseText: error.message, isError: true };
    } else {
      return { responseText: JSON.stringify(error), isError: true };
    }
  }
  logger.info(`Tool function ${toolFunctionName} response: ${responseText}`);
  return { responseText, isError: false };
}

export function getCompleteChatHistory(): HistoryMessage[] {
  if (!existsSync(CHAT_HISTORY_FILE)) return [];

  try {
    const fileContent = readFileSync(CHAT_HISTORY_FILE, "utf-8");
    return fileContent
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => JSON.parse(line))
      .flat();
  } catch (error) {
    console.error("Error reading or parsing file:", error);
    throw error;
  }
}

export function augmentErrorMessage(
  errorMessage: string,
  code: string,
  filepath: string
) {
  const filename = filepath.split("/").slice(-1)[0];

  // matches strings like below, capturing line number, column number, and error message
  // "../../../tmp/enginebkKS7N/src/endpoints/example.ts(33,37): error TS2339: ..."
  const re = new RegExp(`${escapeRegExp(filename)}\\((\\d+),\\d+\\):(.*)`, "g");
  let matches = re.exec(errorMessage);
  if (!matches) {
    return errorMessage;
  }

  const augmentedErrors: string[] = [];
  while (matches) {
    const lineNumber = parseInt(matches[1]);
    const tscError = matches[2].trim();
    const lines = code.split("\n");

    // take the 2 lines before and after the error line
    const startLine = Math.max(lineNumber - 3, 0);
    const endLine = lineNumber + 2;
    const relevantLines = lines.slice(startLine, endLine);

    const numberedLines = relevantLines
      .map((line, index) => `${startLine + index + 1}|${line}`)
      .join("\n");

    augmentedErrors.push(
      `Error in ${filename} at line ${lineNumber}: ${tscError}\n${numberedLines}`
    );

    matches = re.exec(errorMessage);
  }

  return augmentedErrors.join("\n\n");
}
// taken from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions
function escapeRegExp(toEscape: string) {
  return toEscape.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

export function isDirectoryEmptySync(directoryPath: string) {
  try {
    const files = readdirSync(directoryPath);
    return files.length === 0;
  } catch (err) {
    console.error("Error reading directory:", err);
    return false;
  }
}
