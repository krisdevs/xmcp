import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { Implementation } from "@modelcontextprotocol/sdk/types";

export type ToolFile = {
  metadata: any;
  schema: any;
  default: (...args: any[]) => Promise<any>;
};

// @ts-expect-error: injected by compiler
export const injectedTools = INJECTED_TOOLS as Record<
  string,
  () => Promise<ToolFile>
>;

export const INJECTED_CONFIG = {
  // TODO get from project config
  name: "MCP Server",
  version: "0.0.1",
  capabilities: {
    tools: {
      listChanged: true,
    },
  },
} as const satisfies Implementation;

/** Loads tools and injects them into the server */
export async function configureServer(
  server: McpServer,
  toolModules: Map<string, ToolFile>
): Promise<McpServer> {
  return new Promise<McpServer>(async (resolve) => {
    toolModules.forEach((toolModule) => {
      const { default: handler, metadata, schema } = toolModule;
      server.tool(
        metadata.name,
        metadata.description,
        schema,
        metadata.annotations,
        handler
      );
    });

    resolve(server);
  });
}

export function loadTools() {
  const toolModules = new Map<string, ToolFile>();

  const toolPromises = Object.keys(injectedTools).map((path) =>
    injectedTools[path]().then((toolModule) => {
      // TODO add module validation
      toolModules.set(path, toolModule);
    })
  );

  return [toolPromises, toolModules] as const;
}

export async function createServer() {
  const server = new McpServer(INJECTED_CONFIG);
  const [toolPromises, toolModules] = loadTools();
  await Promise.all(toolPromises);
  return configureServer(server, toolModules);
}
