import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// @ts-expect-error: injected by compiler
const mcpServer = INJECTED_MCP_SERVER as McpServer

const transport = new StdioServerTransport();
mcpServer.connect(transport);