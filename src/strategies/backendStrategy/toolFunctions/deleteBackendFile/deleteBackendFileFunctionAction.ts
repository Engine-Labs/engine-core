import { exec as originalExec } from "child_process";
import { existsSync, rmSync } from "fs";
import path from "path";
import { promisify } from "util";
import { logger, PROJECT_DIR } from "../../../../constants";
const exec = promisify(originalExec);

export async function deleteBackendFile(filepath: string): Promise<void> {
  const fullPath = path.normalize(path.resolve(PROJECT_DIR, filepath));

  if (!existsSync(fullPath)) {
    throw new Error(`File ${filepath} does not exist`);
  }

  logger.info(`Deleting file ${fullPath}`);

  try {
    if (!fullPath.startsWith(PROJECT_DIR)) {
      throw new Error(
        `Cannot delete file ${filepath}, it is not in the project directory`
      );
    }

    rmSync(fullPath);

    logger.info("Deleted file, restarting project api");
    await restartProjectApi();
  } catch (e) {
    logger.error(e);
    throw new Error(`Failed to delete file`);
  }
}

export async function restartProjectApi() {
  let serverFile: string;

  serverFile = path.join(PROJECT_DIR, "src", "server.ts");
  await exec(`touch ${serverFile}`);
}
