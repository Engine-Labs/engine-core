import { exec as originalExec, spawn } from "child_process";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { cpSync, mkdtempSync, rmSync } from "fs-extra";
import os from "os";
import path from "path";
import { promisify } from "util";
import { logger, PROJECT_DIR } from "../../../../constants";

const exec = promisify(originalExec);

export async function editBackendFile(
  filepath: string,
  editStartLine: number,
  editEndLine: number,
  content: string
): Promise<void> {
  if (filepath.startsWith(PROJECT_DIR)) {
    filepath = path.relative(PROJECT_DIR, filepath);
  }

  const fullPath = path.join(PROJECT_DIR, filepath);
  if (!fullPath.startsWith(PROJECT_DIR)) {
    throw new Error(
      `Cannot write files with this tool outside of the API directory`
    );
  }

  if (fullPath === path.join(PROJECT_DIR, "prisma", "schema.prisma")) {
    throw new Error(
      "Cannot edit the Prisma schema file manually - it is generated automatically from database migrations"
    );
  }

  if (fullPath === path.join(PROJECT_DIR, "src", "prismaClient.ts")) {
    throw new Error(
      "Cannot edit prismaClient.ts - it has been written carefully so that it does not need to be changed - use it as it is."
    );
  }

  if (!existsSync(fullPath)) {
    throw new Error(`File ${filepath} does not exist`);
  }

  const existingFileContents = readFileSync(fullPath, { encoding: "utf-8" });

  const editedFileContents = replaceLines(
    existingFileContents,
    editStartLine,
    editEndLine,
    content
  );

  try {
    await compileFastifyProjectApi(editedFileContents, filepath);
  } catch (e) {
    logger.error(e);
    const error = e as Error;
    throw new Error(
      `Failed to edit file, please correct the following errors and try again: ${error.message}`
    );
  }

  writeFileSync(path.resolve(PROJECT_DIR, filepath), editedFileContents);
}

function replaceLines(
  existingFileContents: string,
  editStartLine: number,
  editEndLine: number,
  editContents: string
): string {
  if (editStartLine > editEndLine) {
    throw new Error("editStartLine must be less than or equal to editEndLine");
  }

  if (editStartLine < 0 || editEndLine < 0) {
    throw new Error("editStartLine and editEndLine must be non-negative");
  }

  const contentLines = editContents.split(/\r?\n/);

  const existingContentLines = existingFileContents.split(/\r?\n/);

  if (editEndLine > existingContentLines.length) {
    throw new Error(
      `editEndLine must be less than or equal to the number of lines in the file`
    );
  }

  const newContentLines = existingContentLines
    .slice(0, editStartLine - 1)
    .concat(contentLines, existingContentLines.slice(editEndLine));

  return newContentLines.join("\n");
}

async function compileFastifyProjectApi(
  code: string,
  filepath: string
): Promise<void> {
  const tempDir = copyToTempDirectory(PROJECT_DIR);

  writeFileSync(path.join(tempDir, filepath), code);

  try {
    await exec(`npx tsc --project ${tempDir}/tsconfig.json`);
  } catch (error) {
    rmSync(tempDir, { recursive: true, force: true });
    const execError = error as { stdout: string };
    const errorMessage = augmentErrorMessage(execError.stdout, code, filepath);
    throw new Error(errorMessage);
  }

  await testAndStopFastifyDevServer(tempDir);
  rmSync(tempDir, { recursive: true, force: true });
}

function copyToTempDirectory(sourceDir: string) {
  const tempDir = mkdtempSync(`${os.tmpdir()}/engine`);
  cpSync(sourceDir, tempDir, { recursive: true });
  return tempDir;
}

function augmentErrorMessage(
  errorMessage: string,
  code: string,
  filepath: string
) {
  const filename = filepath.split("/").slice(-1)[0];

  // matches strings like
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

async function testAndStopFastifyDevServer(path: string, timeoutMs = 6000) {
  const server = spawn(
    "bun",
    [`${path}/src/server.ts`, "--tsconfig", `${path}/tsconfig.json`],
    {
      env: {
        ...process.env,
        PORT: "10101",
        NODE_NO_WARNINGS: "1",
      },
    }
  );

  const consoleOutput: string[] = [];

  server.stderr.on("data", (data) => {
    consoleOutput.push(data.toString());
  });

  const serverPromise = new Promise<void>((_resolve, reject) => {
    server.on("exit", (_code: unknown) => {
      const err = consoleOutput.join("\n");
      reject(new Error(err));
    });
  });

  const timeoutPromise = new Promise<void>((resolve, reject) => {
    setTimeout(() => {
      if (!server.killed) {
        server.kill();
        resolve();
      } else {
        reject(new Error("tsx process already killed"));
      }
    }, timeoutMs);
  });

  await Promise.race([serverPromise, timeoutPromise]);
}
