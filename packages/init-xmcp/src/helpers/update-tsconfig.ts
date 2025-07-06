import path from "path";
import fs from "fs-extra";
import chalk from "chalk";

/**
 * updates the tsconfig.json file to include the @xmcp/* alias for accessing the handler
 * @param projectRoot - The root directory of the project
 * @returns void
 */
export function updateTsConfig(projectRoot: string) {
  const tsconfigPath = path.join(projectRoot, "tsconfig.json");
  const tsconfig = fs.readJsonSync(tsconfigPath);

  if (!tsconfig) {
    console.log(
      chalk.yellow("No tsconfig.json file found - skipping alias configuration")
    );
    return;
  }

  // there's a file, but it's empty - we can add the compiler options and paths
  if (!tsconfig.compilerOptions) {
    tsconfig.compilerOptions = {};
  }

  if (!tsconfig.compilerOptions.paths) {
    tsconfig.compilerOptions.paths = {};
  }

  // alias for accessing the handler, otherwise should be pointing to .xmcp/adapter when importing it
  tsconfig.compilerOptions.paths["@xmcp/*"] = ["./.xmcp/*"];

  if (!tsconfig.include) {
    tsconfig.include = [];
  }

  // include xmcp.d.ts in the build
  tsconfig.include.push("xmcp.d.ts");

  fs.writeJsonSync(tsconfigPath, tsconfig, { spaces: 2 });
}
