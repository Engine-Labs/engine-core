import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { logger, PROJECT_DIR } from "../../../../constants";

export function runProcess(
  name: string,
  command: string
): ChildProcessWithoutNullStreams {
  const process = spawn(`/bin/bash`, ["-c", `. ~/.profile && ${command}`], {
    stdio: "pipe",
    detached: true,
    shell: false,
    cwd: PROJECT_DIR,
  });

  logger.debug(`Started ${name} process with PID: ${process.pid}`);

  if (!process.pid) {
    throw new Error(`Failed to start subprocess ${name}`);
  }

  process.on("error", (err) => {
    logger.error(`Failed to start subprocess ${name}: ${err.message}`);
    throw new Error(`Failed to start subprocess ${name}: ${err.message}`);
  });

  process.on("exit", (code, signal) => {
    logger.debug(
      `Subprocess ${name} exited with code ${code} and signal ${signal}`
    );
  });

  return process;
}
