import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { z } from "zod";
import { Tool } from "../types/tool";

// Add index signature to allow string indexing
const INJECTED_TOOLS: Record<string, Tool> = {
  "/tools/add.ts": {
    type: "tool",
    handler: (args: { a: number; b: number }) => {
      return args.a + args.b;
    },
    metadata: {
      name: "add",
      description: "Add two numbers",
    },
    schema: {
      a: z.number(),
      b: z.number(),
    },
  },
};

const INJECTED_CONFIG = {
  // get from project config
  name: "MCP Server",
  version: "0.0.1",
};

const server = new McpServer(INJECTED_CONFIG);

Object.keys(INJECTED_TOOLS).map((path) => {
  const { type, handler, metadata, schema } = INJECTED_TOOLS[path];
  if (type === "tool") {
    server.tool(metadata.name, schema, async (args) => {
      const result = await handler(args);
      return {
        content: [{ type: "text", text: String(result) }],
      };
    });
  }
});

export default server;
