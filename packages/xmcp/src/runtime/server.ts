import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { z } from "zod";
// import { Tool } from "../types/tool";

// Add index signature to allow string indexing
// const INJECTED_TOOLS: Record<string, Tool> = {
//   "/tools/add.ts": {
//     type: "tool",
//     handler: (args: { a: number; b: number }) => {
//       return args.a + args.b;
//     },
//     metadata: {
//       name: "add",
//       description: "Add two numbers",
//     },
//     schema: {
//       a: z.number(),
//       b: z.number(),
//     },
//   },
// };

type ToolFile = {
  metadata: any
  schema: any
  default: (...args: any[]) => Promise<any>
}

// @ts-expect-error: injected by compiler
const tools = INJECTED_TOOLS as Record<string, () => Promise<ToolFile>>

const INJECTED_CONFIG = {
  // get from project config
  name: "MCP Server",
  version: "0.0.1",
};


export async function createServer() {

  return new Promise<McpServer>(async (resolve) => {
    const server = new McpServer(INJECTED_CONFIG);

    const promises = Object.keys(tools).map(path => tools[path]())

    Promise.all(promises).then((resolvedTools) => {

      resolvedTools.forEach((tool) => {
        const { default: handler, metadata, schema } = tool;
        server.tool(metadata.name, schema, handler);
      })

      resolve(server)
    })

  })

}

