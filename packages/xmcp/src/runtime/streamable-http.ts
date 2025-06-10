import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import express, { Express, Request, Response, NextFunction } from "express";
import http from "http";
import { createServer } from "./server";
import { randomUUID } from "crypto";

// @ts-expect-error: injected by compiler
const port = STREAMABLE_HTTP_PORT as number;
// @ts-expect-error: injected by compiler
const debug = STREAMABLE_HTTP_DEBUG as boolean;
// @ts-expect-error: injected by compiler
const bodySizeLimit = STREAMABLE_HTTP_BODY_SIZE_LIMIT as string;
// @ts-expect-error: injected by compiler
const endpoint = STREAMABLE_HTTP_ENDPOINT as string;

// configurable from xmcp.config.ts
interface StreamableHttpTransportOptions {
  port?: number;
  endpoint?: string;
  bodySizeLimit?: string;
  debug?: boolean;
  enableSessionManagement?: boolean;
  corsOrigins?: string[];
  bindToLocalhost?: boolean;
}

class StreamableHttpTransport {
  private app: Express;
  private server: http.Server;
  private port: number;
  private endpoint: string;
  private mcpServer: McpServer;
  private activeTransports = new Map<string, any>(); // Will store connection info - resembles sse transport
  private debug: boolean;
  private options: StreamableHttpTransportOptions;

  constructor(
    mcpServer: McpServer,
    options: StreamableHttpTransportOptions = {}
  ) {
    this.mcpServer = mcpServer;
    this.options = {
      enableSessionManagement: true,
      corsOrigins: ["*"],
      bindToLocalhost: true,
      ...options,
    };
    this.app = express();
    this.server = http.createServer(this.app);
    this.port = options.port ?? parseInt(process.env.PORT || "3001", 10);
    this.endpoint = options.endpoint ?? "/mcp";
    this.debug = options.debug ?? false;

    this.setupMiddleware(options.bodySizeLimit || "10mb");
    this.setupRoutes();
  }

  private log(message: string, ...args: any[]): void {
    if (this.debug) {
      console.log(`[StreamableHTTP] ${message}`, ...args);
    }
  }

  private logError(message: string, ...args: any[]): void {
    if (this.debug) {
      console.error(`[StreamableHTTP] ${message}`, ...args);
    }
  }

  private setupMiddleware(bodySizeLimit: string): void {
    // CORS middleware
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const origin = req.get("Origin");
      const corsOrigins = this.options.corsOrigins || ["*"];

      // Validate Origin header to prevent DNS rebinding attacks
      if (
        origin &&
        !corsOrigins.includes("*") &&
        !corsOrigins.includes(origin)
      ) {
        this.logError("Blocked request from unauthorized origin:", origin);
        res.status(403).json({
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message: "Unauthorized origin",
          },
          id: null,
        });
        return;
      }

      // Set CORS headers
      res.setHeader(
        "Access-Control-Allow-Origin",
        corsOrigins.includes("*") ? "*" : origin || "*"
      );
      res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, DELETE, OPTIONS"
      );
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Accept, Mcp-Session-Id, Last-Event-ID, Origin"
      );
      res.setHeader("Access-Control-Expose-Headers", "Mcp-Session-Id");

      if (req.method === "OPTIONS") {
        res.sendStatus(200);
        return;
      }

      next();
    });

    this.app.use(express.json({ limit: bodySizeLimit }));

    // Logging helper
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      this.log(
        `${req.method} ${req.path} - Session: ${req.get("Mcp-Session-Id") || "none"}`
      );
      next();
    });
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get("/health", (_req: Request, res: Response) => {
      res.status(200).json({
        status: "ok",
        transport: "streamable-http",
        activeSessions: this.activeTransports.size,
      });
    });

    // Root endpoint with basic info
    this.app.get("/", (_req: Request, res: Response) => {
      res.send(`
        <html>
          <head><title>MCP Server - Streamable HTTP</title></head>
          <body>
            <h1>MCP Server with Streamable HTTP Transport</h1>
            <p>MCP Endpoint: <a href="${this.endpoint}">${this.endpoint}</a></p>
            <p>Active Sessions: ${this.activeTransports.size}</p>
          </body>
        </html>
      `);
    });

    // Main MCP endpoint - handles GET, POST, DELETE
    this.app.all(this.endpoint, this.handleConnection.bind(this));
  }

  private async handleConnection(req: Request, res: Response): Promise<void> {
    this.log(`${req.method} request to ${this.endpoint}`);

    try {
      // For now, implement basic JSON-RPC handling similar to SSE transport
      // This is a simplified version until StreamableHTTPServerTransport is available
      // see modelcontextprotocol sdk for details

      if (req.method === "POST") {
        // Handle JSON-RPC messages
        const message = req.body;

        // Generate session ID if enabled and not present
        let sessionId = req.get("Mcp-Session-Id");
        if (this.options.enableSessionManagement && !sessionId) {
          sessionId = randomUUID();
          res.setHeader("Mcp-Session-Id", sessionId);
          this.log(`Generated new session ID: ${sessionId}`);
          this.activeTransports.set(sessionId, { connectionTime: new Date() });
        }

        // Basic JSON response for now
        res.status(200).json({
          jsonrpc: "2.0",
          result: "Message processed",
          id: message?.id || null,
        });
      } else if (req.method === "GET") {
        // Handle SSE stream
        const acceptHeader = req.get("Accept") || "";
        if (!acceptHeader.includes("text/event-stream")) {
          res.status(406).json({
            jsonrpc: "2.0",
            error: {
              code: -32000,
              message: "Not Acceptable: Client must accept text/event-stream",
            },
            id: null,
          });
          return;
        }

        // Set SSE headers
        res.writeHead(200, {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        });

        // Send initial connection event
        res.write(`event: connected\ndata: {"status": "connected"}\n\n`);

        // Set up cleanup when client disconnects
        res.on("close", () => {
          this.log("SSE client disconnected");
        });
      } else if (req.method === "DELETE") {
        // Handle session termination
        const sessionId = req.get("Mcp-Session-Id");
        if (sessionId && this.activeTransports.has(sessionId)) {
          this.activeTransports.delete(sessionId);
          this.log(`Terminated session: ${sessionId}`);
        }
        res.status(200).json({ message: "Session terminated" });
      }
    } catch (error) {
      this.logError("Error handling connection:", error);
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal error",
          data: String(error),
        },
        id: null,
      });
    }
  }

  public start(): void {
    const host = this.options.bindToLocalhost ? "127.0.0.1" : "0.0.0.0";

    this.server.listen(this.port, host, () => {
      console.log(
        `[StreamableHTTP] MCP Server running with Streamable HTTP transport on http://${host}:${this.port}`
      );
      console.log(
        `[StreamableHTTP] - MCP endpoint: http://${host}:${this.port}${this.endpoint}`
      );
      console.log(
        `[StreamableHTTP] - Session management: ${this.options.enableSessionManagement ? "enabled" : "disabled"}`
      );
      if (this.debug) {
        console.log("[StreamableHTTP] Debug mode: enabled");
      }

      this.setupShutdownHandlers();
    });
  }

  private setupShutdownHandlers(): void {
    process.on("SIGINT", this.shutdown.bind(this));
    process.on("SIGTERM", this.shutdown.bind(this));
  }

  public shutdown(): void {
    this.log("Shutting down server");

    // Close all active transports
    for (const [sessionId] of this.activeTransports) {
      this.log(`Closing session: ${sessionId}`);
    }
    this.activeTransports.clear();

    this.server.close();
    process.exit(0);
  }

  public getActiveTransportsCount(): number {
    return this.activeTransports.size;
  }
}

// Create and start the Streamable HTTP transport
createServer().then((mcpServer) => {
  const streamableHttpTransport = new StreamableHttpTransport(mcpServer, {
    port,
    debug,
    bodySizeLimit,
    endpoint,
  });
  streamableHttpTransport.start();
});
