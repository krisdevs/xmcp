import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import server from "./server";

class StdioTransport {
  private mcpServer: McpServer;
  private transport: StdioServerTransport;

  constructor(mcpServer: McpServer) {
    this.mcpServer = mcpServer;
    this.transport = new StdioServerTransport();
  }

  public start(): void {
    try {
      this.mcpServer.connect(this.transport);
      console.log("[STDIO] MCP Server running with STDIO transport");
      this.setupShutdownHandlers();
    } catch (error) {
      console.error("[STDIO] Error starting STDIO transport:", error);
      process.exit(1);
    }
  }

  private setupShutdownHandlers(): void {
    process.on("SIGINT", this.shutdown.bind(this));
    process.on("SIGTERM", this.shutdown.bind(this));
  }

  public shutdown(): void {
    console.log("[STDIO] Shutting down STDIO transport");
    process.exit(0);
  }
}

const mcpServer = server;

const stdioTransport = new StdioTransport(mcpServer);
stdioTransport.start();
