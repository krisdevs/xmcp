import path from "path";
import fs from "fs-extra";

/**
 * Update .gitignore to include xmcp and xmcp-env.d.ts entries
 * @param projectPath - The root directory of the project
 * @returns void
 */
export function updateGitignore(projectPath: string): void {
  const gitignorePath = path.join(projectPath, ".gitignore");

  // XMCP entries to add
  const xmcpEntries = ["", "# XMCP", ".xmcp", "xmcp-env.d.ts"];

  let gitignoreContent = "";

  // Read existing .gitignore if it exists
  if (fs.existsSync(gitignorePath)) {
    gitignoreContent = fs.readFileSync(gitignorePath, "utf-8");
  }

  // Always append XMCP entries
  const updatedContent = gitignoreContent + xmcpEntries.join("\n");
  fs.writeFileSync(gitignorePath, updatedContent);
}
