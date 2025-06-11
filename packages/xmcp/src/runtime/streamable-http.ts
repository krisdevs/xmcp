import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import express, { Express, Request, Response, NextFunction } from "express";
import http, { IncomingMessage, ServerResponse } from "http";
import { createServer } from "./server";
import { randomUUID } from "crypto";
import getRawBody from "raw-body";
import contentType from "content-type";

// @ts-expect-error: injected by compiler
const port = STREAMABLE_HTTP_PORT as number;
// @ts-expect-error: injected by compiler
const debug = STREAMABLE_HTTP_DEBUG as boolean;
// @ts-expect-error: injected by compiler
const bodySizeLimit = STREAMABLE_HTTP_BODY_SIZE_LIMIT as string;
// @ts-expect-error: injected by compiler
const endpoint = STREAMABLE_HTTP_ENDPOINT as string;

interface StreamableHttpTransportOptions {
  port?: number;
  endpoint?: string;
  bodySizeLimit?: string;
  debug?: boolean;
  bindToLocalhost?: boolean;
}

interface JsonRpcMessage {
  jsonrpc: string;
  method?: string;
  params?: any;
  id?: string | number | null;
  result?: any;
  error?: any;
}

class StreamableHttpServerTransport {
  sessionId?: string;
  private _started: boolean = false;
  private _streamMapping: Map<string, ServerResponse> = new Map();
  private _requestToStreamMapping: Map<string | number, string> = new Map();
  private _requestResponseMap: Map<string | number, JsonRpcMessage> = new Map();
  private _initialized: boolean = false;
  private _standaloneSseStreamId: string = "_GET_stream";
  private _connectionCount: number = 0;
  private _singleResponseCollectors: Map<
    string,
    {
      res: ServerResponse;
      requestIds: Set<string | number>;
      responses: JsonRpcMessage[];
      expectedCount: number;
    }
  > = new Map();
  private _requestToCollectorMapping: Map<string | number, string> = new Map();

  onclose?: () => void;
  onerror?: (error: Error) => void;
  onmessage?: (message: JsonRpcMessage) => void;

  constructor() {
    // transport initializes without session ID
  }

  async start(): Promise<void> {
    if (this._started) {
      throw new Error("Transport already started");
    }
    this._started = true;
  }

  async close(): Promise<void> {
    this._streamMapping.forEach((response) => {
      response.end();
    });
    this._streamMapping.clear();
    this._requestResponseMap.clear();
    this._requestToStreamMapping.clear();

    this._singleResponseCollectors?.forEach((collector) => {
      if (!collector.res.headersSent) {
        collector.res.writeHead(503).end(
          JSON.stringify({
            jsonrpc: "2.0",
            error: {
              code: -32000,
              message: "Service unavailable: Server shutting down",
            },
            id: null,
          })
        );
      }
    });
    this._singleResponseCollectors?.clear();
    this._requestToCollectorMapping?.clear();

    this._connectionCount = 0;
    this.resetInitializationState();
    this.onclose?.();
  }

  private resetInitializationState(): void {
    this._initialized = false;
    this.sessionId = undefined;
  }

  private trackConnection(): void {
    this._connectionCount++;
    if (debug) {
      console.log(
        `[StreamableHTTP] New connection tracked. Active connections: ${this._connectionCount}`
      );
    }
  }

  private untrackConnection(): void {
    this._connectionCount--;
    if (debug) {
      console.log(
        `[StreamableHTTP] Connection closed. Active connections: ${this._connectionCount}`
      );
    }
    if (this._connectionCount <= 0) {
      this._connectionCount = 0;
      if (debug) {
        console.log(`[StreamableHTTP] No active connections remaining.`);
      }
    }
  }

  async send(message: JsonRpcMessage): Promise<void> {
    let requestId = message.id;

    if (message.result !== undefined || message.error !== undefined) {
      requestId = message.id;
    }

    if (requestId === undefined || requestId === null) {
      const standaloneSse = this._streamMapping.get(
        this._standaloneSseStreamId
      );
      if (standaloneSse === undefined) {
        return;
      }
      this.writeSSEEvent(standaloneSse, message);
      return;
    }

    const collectorId = this._requestToCollectorMapping?.get(requestId);
    if (collectorId) {
      const collector = this._singleResponseCollectors?.get(collectorId);
      if (
        collector &&
        (message.result !== undefined || message.error !== undefined)
      ) {
        collector.responses.push(message);
        collector.requestIds.delete(requestId);

        if (collector.requestIds.size === 0) {
          const headers: Record<string, string> = {
            "Content-Type": "application/json",
          };
          if (this.sessionId !== undefined) {
            headers["mcp-session-id"] = this.sessionId;
          }

          const responseBody =
            collector.responses.length === 1
              ? collector.responses[0]
              : collector.responses;

          collector.res
            .writeHead(200, headers)
            .end(JSON.stringify(responseBody));

          this._singleResponseCollectors?.delete(collectorId);
          for (const response of collector.responses) {
            if (response.id !== undefined && response.id !== null) {
              this._requestToCollectorMapping?.delete(response.id);
            }
          }
        }
      }
      return;
    }

    const streamId = this._requestToStreamMapping.get(requestId);
    const response = this._streamMapping.get(streamId!);

    if (!streamId || !response) {
      throw new Error(
        `No connection established for request ID: ${String(requestId)}`
      );
    }

    this.writeSSEEvent(response, message);

    if (message.result !== undefined || message.error !== undefined) {
      this._requestResponseMap.set(requestId, message);

      const relatedIds = Array.from(this._requestToStreamMapping.entries())
        .filter(([_, sId]) => sId === streamId)
        .map(([id]) => id);

      const allResponsesReady = relatedIds.every((id) =>
        this._requestResponseMap.has(id)
      );

      if (allResponsesReady) {
        response.end();

        for (const id of relatedIds) {
          this._requestResponseMap.delete(id);
          this._requestToStreamMapping.delete(id);
        }
      }
    }
  }

  private writeSSEEvent(res: ServerResponse, message: JsonRpcMessage): boolean {
    const eventData = `event: message\ndata: ${JSON.stringify(message)}\n\n`;
    return res.write(eventData);
  }

  async handleRequest(
    req: IncomingMessage,
    res: ServerResponse,
    parsedBody?: unknown
  ): Promise<void> {
    if (req.method === "POST") {
      await this.handlePOST(req, res, parsedBody);
    } else if (req.method === "GET") {
      await this.handleGET(req, res);
    } else if (req.method === "DELETE") {
      await this.handleDELETE(req, res);
    } else {
      await this.handleUnsupportedRequest(res);
    }
  }

  private async handlePOST(
    req: IncomingMessage,
    res: ServerResponse,
    parsedBody?: unknown
  ): Promise<void> {
    try {
      const acceptHeader = req.headers.accept;
      const acceptsJson = acceptHeader?.includes("application/json");
      const acceptsSse = acceptHeader?.includes("text/event-stream");

      if (!acceptsJson) {
        res.writeHead(406).end(
          JSON.stringify({
            jsonrpc: "2.0",
            error: {
              code: -32000,
              message: "Not Acceptable: Client must accept application/json",
            },
            id: null,
          })
        );
        return;
      }

      let rawMessage;
      if (parsedBody !== undefined) {
        rawMessage = parsedBody;
      } else {
        const ct = req.headers["content-type"];
        if (!ct || !ct.includes("application/json")) {
          res.writeHead(415).end(
            JSON.stringify({
              jsonrpc: "2.0",
              error: {
                code: -32000,
                message:
                  "Unsupported Media Type: Content-Type must be application/json",
              },
              id: null,
            })
          );
          return;
        }

        const parsedCt = contentType.parse(ct);
        const body = await getRawBody(req, {
          limit: bodySizeLimit,
          encoding: parsedCt.parameters.charset ?? "utf-8",
        });
        rawMessage = JSON.parse(body.toString());
      }

      const messages: JsonRpcMessage[] = Array.isArray(rawMessage)
        ? rawMessage
        : [rawMessage];

      const isInitializationRequest = messages.some(
        (msg) => msg.method === "initialize"
      );

      if (isInitializationRequest) {
        const sessionIdHeader = req.headers["mcp-session-id"];
        const canReinitialize =
          !this._initialized ||
          this._connectionCount === 0 ||
          (sessionIdHeader && sessionIdHeader === this.sessionId);

        if (debug) {
          console.log(
            `[StreamableHTTP] Initialize request - initialized: ${this._initialized}, sessionId: ${this.sessionId}, connections: ${this._connectionCount}, sessionIdHeader: ${sessionIdHeader}, canReinitialize: ${canReinitialize}`
          );
        }

        if (
          this._initialized &&
          this.sessionId !== undefined &&
          !canReinitialize
        ) {
          if (debug) {
            console.log(
              `[StreamableHTTP] Rejecting initialization - server already initialized with sessionId: ${this.sessionId}, request sessionId: ${sessionIdHeader}`
            );
          }
          res.writeHead(400).end(
            JSON.stringify({
              jsonrpc: "2.0",
              error: {
                code: -32600,
                message: "Invalid Request: Server already initialized",
              },
              id: null,
            })
          );
          return;
        }

        this.sessionId = randomUUID();
        this._initialized = true;

        if (debug) {
          console.log(
            `[StreamableHTTP] Server initialized with new sessionId: ${this.sessionId}`
          );
        }
      }

      if (!isInitializationRequest && !this.validateSession(req, res)) {
        return;
      }

      const hasRequests = messages.some(
        (msg) => msg.method && msg.id !== undefined
      );

      if (!hasRequests) {
        const headers: Record<string, string> = {};
        if (this.sessionId !== undefined) {
          headers["mcp-session-id"] = this.sessionId;
        }
        res.writeHead(202, headers).end();
        for (const message of messages) {
          this.onmessage?.(message);
        }
      } else {
        const useSseStream = acceptsSse;

        if (debug) {
          console.log(
            `[StreamableHTTP] Request handling mode: ${useSseStream ? "SSE stream" : "single HTTP response"} - acceptsSSE: ${acceptsSse}`
          );
        }

        if (useSseStream) {
          const streamId = randomUUID();
          const headers: Record<string, string> = {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          };

          if (this.sessionId !== undefined) {
            headers["mcp-session-id"] = this.sessionId;
          }

          res.writeHead(200, headers);

          this.trackConnection();

          for (const message of messages) {
            if (
              message.method &&
              message.id !== undefined &&
              message.id !== null
            ) {
              this._streamMapping.set(streamId, res);
              this._requestToStreamMapping.set(message.id, streamId);
            }
          }

          res.on("close", () => {
            this._streamMapping.delete(streamId);
            this.untrackConnection();
          });

          for (const message of messages) {
            this.onmessage?.(message);
          }
        } else {
          const requestIds = messages
            .filter((msg) => msg.method && msg.id !== undefined)
            .map((msg) => msg.id!);

          if (requestIds.length === 0) {
            const headers: Record<string, string> = {};
            if (this.sessionId !== undefined) {
              headers["mcp-session-id"] = this.sessionId;
            }
            res.writeHead(202, headers).end();
            return;
          }

          const responseCollector: JsonRpcMessage[] = [];
          const expectedResponses = requestIds.length;

          const collectorId = randomUUID();
          this._singleResponseCollectors =
            this._singleResponseCollectors || new Map();
          this._singleResponseCollectors.set(collectorId, {
            res,
            requestIds: new Set(requestIds),
            responses: responseCollector,
            expectedCount: expectedResponses,
          });

          for (const requestId of requestIds) {
            this._requestToCollectorMapping =
              this._requestToCollectorMapping || new Map();
            this._requestToCollectorMapping.set(requestId, collectorId);
          }

          for (const message of messages) {
            this.onmessage?.(message);
          }
        }
      }
    } catch (error) {
      res.writeHead(400).end(
        JSON.stringify({
          jsonrpc: "2.0",
          error: {
            code: -32700,
            message: "Parse error",
            data: String(error),
          },
          id: null,
        })
      );
      this.onerror?.(error as Error);
    }
  }

  private async handleGET(
    req: IncomingMessage,
    res: ServerResponse
  ): Promise<void> {
    const acceptHeader = req.headers.accept;
    if (!acceptHeader?.includes("text/event-stream")) {
      res.writeHead(406).end(
        JSON.stringify({
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message: "Not Acceptable: Client must accept text/event-stream",
          },
          id: null,
        })
      );
      return;
    }

    if (!this.validateSession(req, res)) {
      return;
    }

    if (this._streamMapping.get(this._standaloneSseStreamId) !== undefined) {
      res.writeHead(409).end(
        JSON.stringify({
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message: "Conflict: Only one SSE stream is allowed per session",
          },
          id: null,
        })
      );
      return;
    }

    const headers: Record<string, string> = {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    };

    if (this.sessionId !== undefined) {
      headers["mcp-session-id"] = this.sessionId;
    }

    res.writeHead(200, headers).flushHeaders();
    this._streamMapping.set(this._standaloneSseStreamId, res);

    this.trackConnection();

    res.on("close", () => {
      this._streamMapping.delete(this._standaloneSseStreamId);
      this.untrackConnection();
    });
  }

  private async handleDELETE(
    req: IncomingMessage,
    res: ServerResponse
  ): Promise<void> {
    if (debug) {
      console.log(
        `[StreamableHTTP] DELETE request received - current state: initialized=${this._initialized}, sessionId=${this.sessionId}, connections=${this._connectionCount}`
      );
    }

    if (!this.validateSessionForTermination(req, res)) {
      return;
    }

    await this.close();

    if (debug) {
      console.log(
        `[StreamableHTTP] DELETE request completed - state after close: initialized=${this._initialized}, sessionId=${this.sessionId}, connections=${this._connectionCount}`
      );
    }

    res.writeHead(200).end();
  }

  private async handleUnsupportedRequest(res: ServerResponse): Promise<void> {
    res
      .writeHead(405, {
        Allow: "GET, POST, DELETE",
      })
      .end(
        JSON.stringify({
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message: "Method not allowed.",
          },
          id: null,
        })
      );
  }

  private validateSessionForTermination(
    req: IncomingMessage,
    res: ServerResponse
  ): boolean {
    const sessionId = req.headers["mcp-session-id"];

    if (!sessionId) {
      if (!this._initialized || !this.sessionId) {
        if (debug) {
          console.log(
            "[StreamableHTTP] DELETE request with no session ID, but no active session - allowing termination"
          );
        }
        return true;
      }

      res.writeHead(400).end(
        JSON.stringify({
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message: "Bad Request: Mcp-Session-Id header is required",
          },
          id: null,
        })
      );
      return false;
    }

    if (Array.isArray(sessionId)) {
      res.writeHead(400).end(
        JSON.stringify({
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message:
              "Bad Request: Mcp-Session-Id header must be a single value",
          },
          id: null,
        })
      );
      return false;
    }

    if (!this._initialized || sessionId !== this.sessionId) {
      if (debug) {
        console.log(
          `[StreamableHTTP] DELETE request for session ${sessionId}, current state: initialized=${this._initialized}, sessionId=${this.sessionId} - allowing termination`
        );
      }
      return true;
    }

    return true;
  }

  private validateSession(req: IncomingMessage, res: ServerResponse): boolean {
    if (!this._initialized) {
      res.writeHead(400).end(
        JSON.stringify({
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message: "Bad Request: Server not initialized",
          },
          id: null,
        })
      );
      return false;
    }

    const sessionId = req.headers["mcp-session-id"];

    if (!sessionId) {
      res.writeHead(400).end(
        JSON.stringify({
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message: "Bad Request: Mcp-Session-Id header is required",
          },
          id: null,
        })
      );
      return false;
    }

    if (Array.isArray(sessionId)) {
      res.writeHead(400).end(
        JSON.stringify({
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message:
              "Bad Request: Mcp-Session-Id header must be a single value",
          },
          id: null,
        })
      );
      return false;
    }

    if (sessionId !== this.sessionId) {
      res.writeHead(404).end(
        JSON.stringify({
          jsonrpc: "2.0",
          error: {
            code: -32001,
            message: "Session not found",
          },
          id: null,
        })
      );
      return false;
    }

    return true;
  }
}

class StreamableHttpTransport {
  private app: Express;
  private server: http.Server;
  private port: number;
  private endpoint: string;
  private debug: boolean;
  private options: StreamableHttpTransportOptions;
  private transport: StreamableHttpServerTransport;

  constructor(
    mcpServer: McpServer,
    options: StreamableHttpTransportOptions = {}
  ) {
    this.options = {
      bindToLocalhost: true,
      ...options,
    };
    this.app = express();
    this.server = http.createServer(this.app);
    this.port = options.port ?? parseInt(process.env.PORT || "3001", 10);
    this.endpoint = options.endpoint ?? "/mcp";
    this.debug = options.debug ?? false;

    this.transport = new StreamableHttpServerTransport();
    mcpServer.connect(this.transport);

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
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
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

    this.app.use((req: Request, res: Response, next: NextFunction) => {
      this.log(
        `${req.method} ${req.path} - Session: ${req.get("Mcp-Session-Id") || "none"}`
      );
      next();
    });
  }

  private setupRoutes(): void {
    this.app.get("/health", (_req: Request, res: Response) => {
      res.status(200).json({
        status: "ok",
        transport: "streamable-http",
      });
    });

    this.app.get("/", (_req: Request, res: Response) => {
      res.send(`
        <html>
          <head><title>MCP Server - Streamable HTTP</title></head>
          <body>
            <h1>MCP Server with Streamable HTTP Transport</h1>
            <p>MCP Endpoint: <a href="${this.endpoint}">${this.endpoint}</a></p>
            <p>Transport: Streamable HTTP</p>
          </body>
        </html>
      `);
    });

    this.app.use(this.endpoint, async (req: Request, res: Response) => {
      await this.transport.handleRequest(req, res, req.body);
    });
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
        `[StreamableHTTP] - Security: Origin validation enabled, ${this.options.bindToLocalhost ? "localhost-only" : "all interfaces"}`
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
    this.server.close();
    process.exit(0);
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
