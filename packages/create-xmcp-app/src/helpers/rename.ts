import path from "path";
import fs from "fs-extra";

/**
 * Rename special files that need different names (e.g., _gitignore to .gitignore)
 * @param projectPath - Project directory path where files need to be renamed
 */
export function renameFiles(projectPath: string): void {
  const renames = [{ from: "_gitignore", to: ".gitignore" }];

  for (const rename of renames) {
    const sourcePath = path.join(projectPath, rename.from);
    const destPath = path.join(projectPath, rename.to);

    if (fs.existsSync(sourcePath)) {
      fs.copySync(sourcePath, destPath);
      if (rename.from !== rename.to) {
        fs.removeSync(sourcePath);
      }
    }
  }
}
