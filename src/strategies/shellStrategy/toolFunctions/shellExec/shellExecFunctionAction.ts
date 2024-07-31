import { ExecOptions, exec as originalExec } from "child_process";
import { promisify } from "util";
import { logger, PROJECT_DIR } from "../../../../constants";

const exec = promisify(originalExec);

export async function shellExec(
  command: string,
  cwd: string = PROJECT_DIR,
  timeout: number = 60000
): Promise<string> {
  const execOptions: ExecOptions = { cwd, timeout };

  try {
    logger.debug(`Executing command: ${command}`);
    const { stdout, stderr } = await exec(command, execOptions);
    logger.debug(`Command ${command} output: ${stdout}`);
    if (stderr) {
      logger.warn(`shellExec warning: ${stderr}`);
      return stdout === "" ? "Command executed with warnings" : stdout;
    }
    return stdout === "" ? "Command executed successfully" : stdout;
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes("timed out")) {
        logger.error(`shellExec timeout: ${error.message}`);
        throw new Error(`shellExec timed out: ${error.message}`);
      }
      logger.error(`shellExec failed: ${error.message}`);
      throw new Error(`shellExec failed: ${error.message}`);
    }
    logger.error(`shellExec unknown error: ${error}`);
    throw new Error(`shellExec unknown error: ${error}`);
  }
}
