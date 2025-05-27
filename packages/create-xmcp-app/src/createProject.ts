import path from "path";
import fs from "fs-extra";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface CreateProjectOptions {
  projectPath: string;
  projectName: string;
  packageManager: string;
  useLocalXmcp?: boolean;
}

/**
 * Create a new XMCP project
 */
export async function createProject(
  options: CreateProjectOptions
): Promise<void> {
  const { projectPath, projectName, packageManager, useLocalXmcp } = options;

  await fs.ensureDir(projectPath);

  const templateDir = path.join(__dirname, "../templates", "typescript");

  // exclude node_modules and package-lock.json
  await fs.copy(templateDir, projectPath, {
    filter: (src) => {
      const basename = path.basename(src);
      return basename !== "node_modules" && basename !== "package-lock.json";
    },
  });

  // rename _gitignore to .gitignore
  const renames = [{ from: "_gitignore", to: ".gitignore" }];

  for (const rename of renames) {
    const sourcePath = path.join(projectPath, rename.from);
    const destPath = path.join(projectPath, rename.to);

    if (fs.existsSync(sourcePath)) {
      await fs.copy(sourcePath, destPath);
      await fs.remove(sourcePath);
    }
  }

  const packageJsonPath = path.join(projectPath, "package.json");
  const packageJson = await fs.readJson(packageJsonPath);
  packageJson.name = projectName;

  if (useLocalXmcp) {
    const xmcpPath = path.resolve(__dirname, "../../../packages/xmcp");
    packageJson.dependencies["xmcp"] = `file:${xmcpPath}`;
  } else {
    // Replace workspace:* with the latest npm version for non-local development
    packageJson.dependencies["xmcp"] = "latest";
  }

  await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });

  await fs.ensureDir(path.join(projectPath, ".xmcp"));

  const installCommand = getInstallCommand(packageManager);
  try {
    execSync(installCommand, { cwd: projectPath, stdio: "ignore" });
  } catch (error) {
    throw new Error(
      `Failed to install dependencies: ${(error as Error).message}`
    );
  }
}

/**
 * Get the install command for the selected package manager
 */
function getInstallCommand(packageManager: string): string {
  switch (packageManager) {
    case "yarn":
      return "yarn install";
    case "pnpm":
      return "pnpm install";
    case "npm":
    default:
      return "npm install";
  }
}
