import path from "path";
import fs from "fs-extra";

/**
 * Generate xmcp.config.ts based on selected framework adapter
 * @param projectPath - Project directory path
 * @param frameworkAdapter - Selected framework adapter
 */
export function generateConfig(
  projectPath: string,
  frameworkAdapter: string,
  toolsPath: string
): void {
  let configContent = `import { type XmcpConfig } from "xmcp";

const config: XmcpConfig = {
  http: true,
  experimental: {
    adapter: "${frameworkAdapter}",
  },
  paths: {
    tools: "${toolsPath}",
  },
};

export default config;`;

  const configPath = path.join(projectPath, "xmcp.config.ts");
  fs.writeFileSync(configPath, configContent);
}
