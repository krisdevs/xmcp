import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"

// @ts-expect-error: injected by compiler
const mcpServer = INJECTED_MCP_SERVER as any as McpServer

export function sse() {
  console.log('sse', mcpServer)
}