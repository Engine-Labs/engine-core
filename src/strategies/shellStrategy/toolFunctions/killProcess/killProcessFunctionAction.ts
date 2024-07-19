import { logger } from "../../../../constants";
import { backgroundProcessPids } from "../runProcess/runProcessFunctionAction";

export async function killProcess(name: string): Promise<void> {
  logger.debug(`Trying to kill process: ${name}`);

  const pid = parseInt(backgroundProcessPids[name], 10);
  if (!pid) {
    throw new Error(`Could not find process: ${name}`);
  }

  try {
    process.kill(pid, 0);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ESRCH") {
      delete backgroundProcessPids[name];
      throw new Error(`Process ${name} does not exist.`);
    } else if (err.code === "EPERM") {
      throw new Error(`No permission to signal process ${name}.`);
    }
    throw new Error(`Failed to kill process ${name} = unknown error`);
  }

  try {
    process.kill(pid, "SIGTERM");
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    throw new Error(`Failed to kill process ${name}: ${err.message}`);
  }

  delete backgroundProcessPids[name];
}
