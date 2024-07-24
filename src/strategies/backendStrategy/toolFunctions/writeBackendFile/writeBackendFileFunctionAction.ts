import { exec as originalExec, spawn } from "child_process";
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "fs";
import os from "os";
import path from "path";
import { promisify } from "util";
import { logger, PROJECT_DIR } from "../../../../constants";
import { augmentErrorMessage } from "../../../../chatUtils";

const exec = promisify(originalExec);

export function getFileContents(filepath: string): string {
  const fullPath = path.join(PROJECT_DIR, filepath);
  if (existsSync(fullPath)) {
    return readFileSync(fullPath, { encoding: "utf-8" });
  } else {
    throw new Error(`File ${filepath} does not exist`);
  }
}

export async function restartProjectApi() {
  // touch the server file to restart the project api
  let serverFile: string;

  serverFile = path.join(PROJECT_DIR, "src", "server.ts");
  await exec(`touch ${serverFile}`);
}

export async function writeBackendFile(
  filepath: string,
  code: string
): Promise<void> {
  if (filepath.startsWith(PROJECT_DIR)) {
    filepath = path.relative(PROJECT_DIR, filepath);
  }

  const fullPath = path.join(PROJECT_DIR, filepath);

  if (fullPath === path.join(PROJECT_DIR, "prisma", "schema.prisma")) {
    throw new Error(
      "Cannot overwrite the Prisma schema file manually - it is generated automatically from database migrations"
    );
  }

  if (fullPath === path.join(PROJECT_DIR, "src", "prismaClient.ts")) {
    throw new Error(
      "Cannot overwrite prismaClient.ts - it has been written carefully so that it does not need to be changed - use it as it is."
    );
  }

  try {
    await compileFastifyProjectApi(code, filepath);
  } catch (e) {
    logger.error(e);
    const error = e as Error;
    throw new Error(
      `Failed to write file, please correct the following errors and try again: ${error.message}`
    );
  }

  writeFileSync(path.resolve(PROJECT_DIR, filepath), code);
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

export async function compileFastifyProjectApi(
  code: string,
  filepath: string
): Promise<void> {
  const tempDir = copyToTempDirectory(PROJECT_DIR);

  writeFileSync(path.join(tempDir, filepath), code);

  try {
    await exec(`bun tsc --project ${tempDir}/tsconfig.json`);
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
