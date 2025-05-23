import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";

type ToolFile = {
  metadata: any;
  schema: any;
  default: (...args: any[]) => Promise<any>;
};

// @ts-expect-error: injected by compiler
const tools = INJECTED_TOOLS as Record<string, () => Promise<ToolFile>>;

const INJECTED_CONFIG = {
  // get from project config
  name: "MCP Server",
  version: "0.0.1",
};

export async function createServer() {
  return new Promise<McpServer>(async (resolve) => {
    const server = new McpServer(INJECTED_CONFIG);

    const promises = Object.keys(tools).map((path) => tools[path]());

    Promise.all(promises).then((resolvedTools) => {
      resolvedTools.forEach((tool) => {
        const { default: handler, metadata, schema } = tool;
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
  });
}
