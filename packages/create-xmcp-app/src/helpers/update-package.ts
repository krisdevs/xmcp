import path from "path";
import fs from "fs-extra";

/**
 * Update package.json with project-specific configuration
 * @param projectPath - Project directory path
 * @param projectName - Name of the project
 * @param useLocalXmcp - Whether to use local xmcp dependency
 * @param deployToVercel - Whether to add Vercel deployment configuration
 */
export function updatePackageJson(
  projectPath: string,
  projectName: string,
  useLocalXmcp?: boolean,
  deployToVercel?: boolean
): void {
  const packageJsonPath = path.join(projectPath, "package.json");
  const packageJson = fs.readJsonSync(packageJsonPath);

  packageJson.name = projectName;

  if (useLocalXmcp) {
    const xmcpPath = path.resolve(__dirname, "../../../packages/xmcp");
    packageJson.dependencies["xmcp"] = `file:${xmcpPath}`;
  } else {
    packageJson.dependencies["xmcp"] = "latest";
  }

  if (deployToVercel) {
    packageJson.scripts.postbuild = "xmcp build:vercel";
  }

  fs.writeJsonSync(packageJsonPath, packageJson, { spaces: 2 });
}
