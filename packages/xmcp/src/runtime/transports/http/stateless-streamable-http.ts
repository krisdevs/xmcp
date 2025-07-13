import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import express, {
  Express,
  Request,
  Response,
  NextFunction,
  RequestHandler,
} from "express";
import http, { IncomingMessage, ServerResponse } from "http";
import { randomUUID } from "node:crypto";
import getRawBody from "raw-body";
import contentType from "content-type";
import {
  BaseHttpServerTransport,
  JsonRpcMessage,
  HttpTransportOptions,
} from "./base-streamable-http";
import homeTemplate from "../../templates/home";
import { httpContextProvider } from "./http-context";
import { createOAuthProxy, type OAuthProxyConfig } from "../../../auth/oauth";
import { OAuthProxy } from "../../../auth/oauth/factory";
import { greenCheck } from "../../../utils/cli-icons";
import { setResponseCorsHeaders } from "./setup-cors";

export type CorsOptions = {
  origin?: string | string[] | boolean;
  methods?: string | string[];
  allowedHeaders?: string | string[];
  exposedHeaders?: string | string[];
  credentials?: boolean;
  maxAge?: number;
};

// no session management, POST only
export class StatelessHttpServerTransport extends BaseHttpServerTransport {
  debug: boolean;
  bodySizeLimit: string;
  private _started: boolean = false;
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

  constructor(debug: boolean, bodySizeLimit: string) {
    super();
    this.debug = debug;
    this.bodySizeLimit = bodySizeLimit;
  }

  // avoid restarting
  // sort of singleton
  async start(): Promise<void> {
    if (this._started) {
      throw new Error("Transport already started");
    }
    this._started = true;
  }

  async close(): Promise<void> {
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
  }

  async send(message: JsonRpcMessage): Promise<void> {
    const requestId = message.id;

    if (requestId === undefined || requestId === null) {
      // In stateless mode, we can't handle notifications without request IDs
      if (this.debug) {
        console.log("[StatelessHTTP] Dropping notification without request ID");
      }
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
    }
  }

  async handleRequest(
    req: IncomingMessage,
    res: ServerResponse,
    parsedBody?: unknown
  ): Promise<void> {
    // Only support POST in stateless mode
    if (req.method !== "POST") {
      res.writeHead(405).end(
        JSON.stringify({
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message: "Method not allowed.",
          },
          id: null,
        })
      );
      return;
    }

    await this.handlePOST(req, res, parsedBody);
  }

  private async handlePOST(
    req: IncomingMessage,
    res: ServerResponse,
    parsedBody?: unknown
  ): Promise<void> {
    try {
      const acceptHeader = req.headers.accept;
      const acceptsJson = acceptHeader?.includes("application/json");

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
          limit: this.bodySizeLimit,
          encoding: parsedCt.parameters.charset ?? "utf-8",
        });
        rawMessage = JSON.parse(body.toString());
      }

      const messages: JsonRpcMessage[] = Array.isArray(rawMessage)
        ? rawMessage
        : [rawMessage];

      const hasRequests = messages.some(
        (msg) => msg.method && msg.id !== undefined
      );

      if (!hasRequests) {
        // Handle notifications (no response expected)
        res.writeHead(202).end();
        return;
      }

      // Handle requests that expect responses
      const requestIds = messages
        .filter((msg) => msg.method && msg.id !== undefined)
        .map((msg) => msg.id!);

      if (requestIds.length === 0) {
        res.writeHead(202).end();
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

      // MCP SDK transport interface mandatory
      for (const message of messages) {
        if (this.onmessage) {
          this.onmessage(message);
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
    }
  }
}

// Stateless HTTP Transport wrapper
export class StatelessStreamableHTTPTransport {
  private app: Express;
  private server: http.Server;
  private port: number;
  private endpoint: string;
  private debug: boolean;
  private options: HttpTransportOptions;
  private createServerFn: () => Promise<McpServer>;
  private corsOptions: CorsOptions;
  private oauthProxy: OAuthProxy | undefined;
  private middlewares: RequestHandler[] | undefined;

  constructor(
    createServerFn: () => Promise<McpServer>,
    options: HttpTransportOptions = {},
    corsOptions: CorsOptions = {},
    oauthConfig?: OAuthProxyConfig | null,
    middlewares?: RequestHandler[]
  ) {
    this.options = {
      bindToLocalhost: !options.host,
      ...options,
    };
    this.app = express();
    this.server = http.createServer(this.app);
    this.port = options.port ?? parseInt(process.env.PORT || "3001", 10);
    this.endpoint = options.endpoint ?? "/mcp";
    this.debug = options.debug ?? false;
    this.createServerFn = createServerFn;
    this.corsOptions = corsOptions;
    this.middlewares = middlewares;

    // setup oauth proxy if configuration is provided
    if (oauthConfig) {
      this.oauthProxy = createOAuthProxy(oauthConfig);
    }

    this.setupMiddleware(options.bodySizeLimit || "10mb");

    this.setupRoutes();
  }

  private log(message: string, ...args: any[]): void {
    if (this.debug) {
      console.log(`[StatelessHTTP] ${message}`, ...args);
    }
  }

  private setupMiddleware(bodySizeLimit: string): void {
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const cors = this.corsOptions;
      // set cors headers dynamically
      setResponseCorsHeaders(cors, res);
      next();
    });

    this.app.use(express.json({ limit: bodySizeLimit }));

    this.app.use((req: Request, _res: Response, next: NextFunction) => {
      this.log(`${req.method} ${req.path}`);
      next();
    });
  }

  private setupRoutes(): void {
    this.app.get("/health", (_req: Request, res: Response) => {
      res.status(200).json({
        status: "ok",
        transport: "streamable-http",
        mode: "stateless",
      });
    });

    this.app.get("/", (_req: Request, res: Response) => {
      res.send(homeTemplate(this.endpoint));
    });

    if (this.oauthProxy) {
      this.app.use(this.oauthProxy.router);
    }

    // isolate requests context
    this.app.use((req: Request, _res: Response, next: NextFunction) => {
      const id = randomUUID();
      httpContextProvider({ id, headers: req.headers }, () => {
        next();
      });
    });

    // routes beyond this point get intercepted by the middleware
    if (this.middlewares && this.middlewares.length > 0) {
      this.app.use(this.middlewares);
    }

    if (this.oauthProxy) {
      this.app.use(this.oauthProxy.middleware);
    }

    this.app.use(this.endpoint, async (req: Request, res: Response) => {
      await this.handleStatelessRequest(req, res);
    });
  }

  private async handleStatelessRequest(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      // Create new instances for complete isolation
      const server = await this.createServerFn();
      const transport = new StatelessHttpServerTransport(
        this.debug,
        this.options.bodySizeLimit || "10mb"
      );

      // cleanup when request/connection closes
      res.on("close", () => {
        transport.close();
        server.close();
      });

      await server.connect(transport);

      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error("[HTTP-server] Error handling MCP request:", error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: {
            code: -32603,
            message: "Internal server error",
          },
          id: null,
        });
      }
    }
  }

  public start(): void {
    const host = this.options.host || (this.options.bindToLocalhost ? "127.0.0.1" : "0.0.0.0");

    this.server.listen(this.port, host, () => {
      console.log(
        `${greenCheck} MCP Server running on http://${host}:${this.port}${this.endpoint}`
      );

      if (this.oauthProxy && this.debug) {
        console.log(`🔐 OAuth endpoints available:`);
        console.log(
          `   Discovery: http://${host}:${this.port}/.well-known/oauth-authorization-server`
        );
        console.log(
          `   Authorize: http://${host}:${this.port}/oauth2/authorize`
        );
        console.log(`   Token: http://${host}:${this.port}/oauth2/token`);
        console.log(`   Revoke: http://${host}:${this.port}/oauth2/revoke`);
        console.log(
          `   Introspect: http://${host}:${this.port}/oauth2/introspect`
        );
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
