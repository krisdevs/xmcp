import { generateConfig } from "./generate-config.js";
import { updatePackageJson } from "./update-package.js";
import { install } from "./install.js";
import { createTool } from "./create-tool.js";
import { Framework } from "./detect-framework.js";

interface InitOptions {
  projectRoot: string;
  framework: Framework;
  toolsPath: string;
  packageManager: "npm" | "yarn" | "pnpm";
}

export async function init(options: InitOptions) {
  const { projectRoot, framework, toolsPath, packageManager } = options;

  generateConfig(projectRoot, framework, toolsPath);

  await install(projectRoot, packageManager);

  updatePackageJson(projectRoot);

  createTool(projectRoot, toolsPath);
}
