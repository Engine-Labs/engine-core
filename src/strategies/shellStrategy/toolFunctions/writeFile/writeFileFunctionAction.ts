import { writeFileSync } from "fs";
import path from "path";
import { PROJECT_DIR } from "../../../../constants";

export function writeFile(filePath: string, code: string): string {
  const fullPath = path.join(PROJECT_DIR, filePath);
  try {
    writeFileSync(fullPath, code, "utf8");
    return "File written successfully";
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to write file: ${error.message}`);
    } else {
      throw new Error("Failed to write file due to an unknown error.");
    }
  }
}
