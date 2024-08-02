import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { logger, PROJECT_DIR } from "../../../../constants";

export function runProcess(command: string): ChildProcessWithoutNullStreams {
  const process = spawn(`/bin/bash`, ["-c", `. ~/.profile && ${command}`], {
    stdio: "pipe",
    detached: true,
    shell: false,
    cwd: PROJECT_DIR,
  });

  logger.debug(`Started subprocess with PID: ${process.pid}`);

  if (!process.pid) {
    throw new Error("Failed to start subprocess");
  }

  process.on("error", (err) => {
    logger.error(`Failed to start subprocess: ${err.message}`);
    throw new Error(`Failed to start subprocess: ${err.message}`);
  });

  process.on("exit", (code, signal) => {
    logger.debug(`Subprocess exited with code ${code} and signal ${signal}`);
  });

  return process;
}
