import { ExecException, exec as originalExec } from "child_process";
import { rmSync, writeFileSync } from "fs";
import { ensureDirSync } from "fs-extra";
import { promisify } from "util";
import {
  logger,
  PROJECT_API_MIGRATIONS_DIR,
  PROJECT_DIR,
} from "../../../../constants";

const exec = promisify(originalExec);

function addSemicolons(migrations: string[]): string[] {
  return migrations.map((migration) => {
    if (migration.endsWith(";")) {
      return migration;
    } else {
      return `${migration};`;
    }
  });
}

function getUnixTimestamp() {
  return Math.floor(new Date().getTime() / 1000);
}

export async function dbMigrate(): Promise<{ stdout: string; stderr: string }> {
  return exec(
    `DATABASE_NO_DUMP_SCHEMA=true DATABASE_MIGRATIONS_FOLDER=${PROJECT_API_MIGRATIONS_DIR} /usr/local/bin/geni up`
  );
}

export async function createMigration(
  upMigrations: string[],
  downMigrations: string[]
): Promise<void> {
  const upFileContents = addSemicolons(upMigrations).join("\n");
  const downFileContents = addSemicolons(downMigrations).join("\n");

  ensureDirSync(PROJECT_API_MIGRATIONS_DIR);

  const timestamp = getUnixTimestamp();
  const upMigrationFileName = `${PROJECT_API_MIGRATIONS_DIR}/${timestamp}_migration.up.sql`;
  const downMigrationFileName = `${PROJECT_API_MIGRATIONS_DIR}/${timestamp}_migration.down.sql`;

  writeFileSync(upMigrationFileName, upFileContents);
  writeFileSync(downMigrationFileName, downFileContents);

  try {
    await dbMigrate();
    await exec(
      `cd ${PROJECT_DIR} && bun prisma db pull && bun prisma generate`
    );
  } catch (error) {
    logger.error(error);
    const execError = error as ExecException;

    // TODO: check cmd exists instead of casting
    const command = execError.cmd as string;
    const index = execError.message.indexOf(command);
    const errorMessage = execError.message.slice(index + command.length + 1);
    logger.error(errorMessage);

    // delete files
    rmSync(upMigrationFileName);
    rmSync(downMigrationFileName);
    throw new Error(errorMessage);
  }
}
