import path from "path";
import fs from "fs-extra";

/**
 * Copy template files to the project directory, excluding unnecessary files
 * @param templateDir - Source template directory path
 * @param projectPath - Destination project directory path
 */
export function copyTemplate(templateDir: string, projectPath: string): void {
  fs.copySync(templateDir, projectPath, {
    filter: (src) => {
      const basename = path.basename(src);
      return (
        // node_modules could be skipped
        basename !== "node_modules" &&
        basename !== "package-lock.json" &&
        basename !== "yarn.lock" &&
        basename !== "pnpm-lock.yaml" &&
        basename !== "vercel.json"
      );
    },
  });
}
