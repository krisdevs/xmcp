// create-next-app helper
import { readdirSync, lstatSync } from "fs";
import { join } from "path";

const VALID_FILES = [
  ".DS_Store",
  ".git",
  ".gitattributes",
  ".gitignore",
  ".gitlab-ci.yml",
  ".hg",
  ".hgcheck",
  ".hgignore",
  ".idea",
  ".npmignore",
  ".travis.yml",
  "LICENSE",
  "Thumbs.db",
  "docs",
  "mkdocs.yml",
  "npm-debug.log",
  "yarn-debug.log",
  "yarn-error.log",
  "yarnrc.yml",
  ".yarn",
];

/**
 * Check if a folder is empty
 * @param root - The root directory path
 * @param name - The name of the directory
 * @returns True if the folder is empty, false otherwise
 */
export function isFolderEmpty(root: string, name: string): boolean {
  const validFiles = new Set(VALID_FILES);

  const files = readdirSync(root);

  // Filter out valid files that don't prevent initialization
  const conflictingFiles = files.filter((file) => !validFiles.has(file));

  if (conflictingFiles.length > 0) {
    console.log(`The directory ${name} contains files that could conflict:`);
    for (const file of conflictingFiles) {
      try {
        const stats = lstatSync(join(root, file));
        const type = stats.isDirectory() ? "directory" : "file";
        console.log(`  ${file} (${type})`);
      } catch {
        console.log(`  ${file} (unknown)`);
      }
    }
    console.log(
      "Either try using a new directory name, or remove the files listed above."
    );
    return false;
  }

  return true;
}
