import fs from "fs-extra";
import path from "path";
import chalk from "chalk";

/**
 * Create mcp route folder and file with handler
 * only on Next.js projects
 * @param projectRoot - Project root directory
 * @param handlerPath - Path for route folder (relative to project root)
 */
export function createRoute(projectRoot: string, handlerPath: string): void {
  // normalize the path to handle any path separators correctly
  const normalizedHandlerPath = path.normalize(handlerPath);
  const handlerDirPath = path.join(projectRoot, normalizedHandlerPath);

  try {
    // create route folder and all parent directories
    fs.ensureDirSync(handlerDirPath);

    const routeFilePath = path.join(handlerDirPath, "route.ts");
    fs.writeFileSync(routeFilePath, handlerTemplate);

    console.log(
      chalk.green(`Created route: ${normalizedHandlerPath}/route.ts`)
    );
  } catch (error) {
    console.error(chalk.red(`Failed to create route: ${error}`));
    process.exit(1);
  }
}

const handlerTemplate = `import { xmcpHandler } from '@xmcp/adapter';

export { xmcpHandler as GET, xmcpHandler as POST };
`;
