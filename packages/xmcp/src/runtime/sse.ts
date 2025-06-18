import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import express, { Express, Request, Response, NextFunction } from "express";
import http from "http";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { createServer } from "./server";
import homeTemplate from "../templates/home";

// @ts-expect-error: injected by compiler
const port = SSE_PORT as number;
// @ts-expect-error: injected by compiler
const debug = SSE_DEBUG as boolean;
// @ts-expect-error: injected by compiler
const bodySizeLimit = SSE_BODY_SIZE_LIMIT as string;

interface SSETransportOptions {
  port?: number;
  bodySizeLimit?: string;
  debug?: boolean;
}

type CorsOptions = {
  origin?: string | string[] | boolean;
  methods?: string | string[];
  allowedHeaders?: string | string[];
  exposedHeaders?: string | string[];
  credentials?: boolean;
  maxAge?: number;
};

class SSETransport {
  // not using interface here to avoid exposing private members
  private app: Express;
  private server: http.Server;
  private port: number;
  private mcpServer: McpServer;
  private activeTransports = new Map<string, SSEServerTransport>();
  private debug: boolean;
  private corsOptions: CorsOptions;

  constructor(
    mcpServer: McpServer,
    options: SSETransportOptions = {},
    corsOptions: CorsOptions = {}
  ) {
    this.mcpServer = mcpServer;
    this.app = express();
    this.server = http.createServer(this.app);
    this.port = options.port ?? parseInt(process.env.PORT || "3001", 10); // 3001 port by default supported by debugger
    this.debug = options.debug ?? false;
    this.corsOptions = corsOptions;

    this.setupMiddleware(options.bodySizeLimit || "10mb");
    this.setupRoutes();
  }

  private log(message: string, ...args: any[]): void {
    if (this.debug) {
      console.log(`[SSE] ${message}`, ...args);
    }
  }

  private logError(message: string, ...args: any[]): void {
    if (this.debug) {
      console.error(`[SSE] ${message}`, ...args);
    }
  }

  private setupMiddleware(bodySizeLimit: string): void {
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const cors = this.corsOptions;
      if (cors.origin !== undefined)
        res.setHeader(
          "Access-Control-Allow-Origin",
          Array.isArray(cors.origin)
            ? cors.origin.join(",")
            : String(cors.origin)
        );
      if (cors.methods !== undefined)
        res.setHeader(
          "Access-Control-Allow-Methods",
          Array.isArray(cors.methods)
            ? cors.methods.join(",")
            : String(cors.methods)
        );
      if (cors.allowedHeaders !== undefined)
        res.setHeader(
          "Access-Control-Allow-Headers",
          Array.isArray(cors.allowedHeaders)
            ? cors.allowedHeaders.join(",")
            : String(cors.allowedHeaders)
        );
      if (cors.exposedHeaders !== undefined)
        res.setHeader(
          "Access-Control-Expose-Headers",
          Array.isArray(cors.exposedHeaders)
            ? cors.exposedHeaders.join(",")
            : String(cors.exposedHeaders)
        );
      if (typeof cors.credentials === "boolean")
        res.setHeader(
          "Access-Control-Allow-Credentials",
          String(cors.credentials)
        );
      if (typeof cors.maxAge === "number")
        res.setHeader("Access-Control-Max-Age", String(cors.maxAge));

      if (req.method === "OPTIONS") {
        res.sendStatus(200);
        return;
      }

      next();
    });

    this.app.use(express.json({ limit: bodySizeLimit }));

    // Logging helper
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      this.log(`${req.method} ${req.path}`);
      next();
    });
  }

  private setupRoutes(): void {
    // root endpoint
    this.app.get("/", (_req: Request, res: Response) => {
      res.send(homeTemplate("/sse"));
    });

    this.app.get("/health", (_req: Request, res: Response) => {
      res.status(200).json({ status: "ok" });
    });

    this.app.get("/sse", this.handleConnection.bind(this));

    this.app.post("/message", this.handleMessage.bind(this));
  }

  private async handleConnection(req: Request, res: Response): Promise<void> {
    this.log("Client connected to SSE endpoint");
    const transport = new SSEServerTransport("/message", res);

    try {
      this.mcpServer.connect(transport);

      const sessionId = transport.sessionId;
      this.log(`Created transport with session ID: ${sessionId}`);

      this.activeTransports.set(sessionId, transport);

      // cleanup when client disconnects
      req.on("close", () => {
        this.log(`Client disconnected for session ID: ${sessionId}`);
        this.activeTransports.delete(sessionId);
        transport.close().catch((err) => {
          this.logError("Error closing transport:", err);
        });
      });
    } catch (error) {
      this.logError("Error starting transport:", error);
      res.status(500).end("Internal Server Error");
    }
  }

  private async handleMessage(req: Request, res: Response): Promise<void> {
    const sessionId = req.query.sessionId as string;

    if (!sessionId) {
      this.log("Missing sessionId parameter");
      res.status(400).json({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Missing sessionId parameter",
        },
        id: req.body?.id || null,
      });
      return;
    }

    const transport = this.activeTransports.get(sessionId);

    if (!transport) {
      this.log(`No active session found for sessionId: ${sessionId}`);
      res.status(404).json({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: `No active session found for sessionId: ${sessionId}`,
        },
        id: req.body?.id || null,
      });
      return;
    }

    try {
      await transport.handlePostMessage(req, res, req.body);
    } catch (error: any) {
      this.logError("Error handling message:", error);
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal error",
          data: error.message,
        },
        id: req.body?.id || null,
      });
    }
  }

  public start(): void {
    this.server.listen(this.port, () => {
      console.log(
        `[SSE] MCP Server running with SDK transport on http://localhost:${this.port}`
      );
      console.log(`[SSE] - SSE endpoint: http://localhost:${this.port}/sse`);
      if (this.debug) {
        console.log("[SSE] Debug mode: enabled");
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
    this.server.close();
    process.exit(0);
  }

  public getActiveTransportsCount(): number {
    return this.activeTransports.size;
  }
}

// @ts-expect-error: injected by compiler
const corsOrigin = SSE_CORS_ORIGIN as string;
// @ts-expect-error: injected by compiler
const corsMethods = SSE_CORS_METHODS as string;
// @ts-expect-error: injected by compiler
const corsAllowedHeaders = SSE_CORS_ALLOWED_HEADERS as string;
// @ts-expect-error: injected by compiler
const corsExposedHeaders = SSE_CORS_EXPOSED_HEADERS as string;
// @ts-expect-error: injected by compiler
const corsCredentials = SSE_CORS_CREDENTIALS as boolean;
// @ts-expect-error: injected by compiler
const corsMaxAge = SSE_CORS_MAX_AGE as number;

const corsOptions: CorsOptions = {
  origin: corsOrigin,
  methods: corsMethods,
  allowedHeaders: corsAllowedHeaders,
  exposedHeaders: corsExposedHeaders,
  credentials: corsCredentials,
  maxAge: corsMaxAge,
};

// Create and start the SSE transport
createServer().then((mcpServer) => {
  const sseTransport = new SSETransport(
    mcpServer,
    {
      port,
      debug,
      bodySizeLimit,
    },
    corsOptions
  );
  sseTransport.start();
});
