import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import express, { Express, Request, Response, NextFunction } from "express"
import http from "http"
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js"

// configurable from xmcp.config.ts
interface SSETransportOptions {
  port?: number;
  bodySizeLimit?: string;
}

class SSETransport {
  // not using interface here to avoid exposing private members
  private app: Express;
  private server: http.Server;
  private port: number;
  private mcpServer: McpServer;
  private activeTransports = new Map<string, SSEServerTransport>();

  constructor(mcpServer: McpServer, options: SSETransportOptions = {}) {
    this.mcpServer = mcpServer;
    this.app = express();
    this.server = http.createServer(this.app);
    this.port = options.port ?? parseInt(process.env.PORT || "3001", 10); // 3001 port by default supported by debugger
    
    this.setupMiddleware(options.bodySizeLimit || '10mb');
    this.setupRoutes();
  }
  
  private setupMiddleware(bodySizeLimit: string): void {
    // middleware and stuff
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
      
      // TODO: add auth / CORS handling as it should be done in a real app
    
      if (req.method === "OPTIONS") {
        res.sendStatus(200);
        return;
      }
      
      next();
    });
    
    this.app.use(express.json({ limit: bodySizeLimit }));
    
    // Logging helper
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      console.log(`[SSE] ${req.method} ${req.path}`);
      next();
    });
  }
  
  private setupRoutes(): void {
    // root endpoint
    this.app.get('/', (_req: Request, res: Response) => {
      res.send(`
        <html>
          <head><title>MCP Server</title></head>
          <body>
            <h1>MCP Server is running</h1>
            <p>SSE Endpoint: <a href="/sse">/sse</a></p>
          </body>
        </html>
      `);
    });
    
    this.app.get('/health', (_req: Request, res: Response) => {
      res.status(200).json({ status: 'ok' });
    });
    
    this.app.get('/sse', this.handleConnection.bind(this));
    
    this.app.post('/message', this.handleMessage.bind(this));
  }
  
  private async handleConnection(req: Request, res: Response): Promise<void> {
    console.log('[SSE] Client connected to SSE endpoint');
    const transport = new SSEServerTransport('/message', res);
    
    try {
      this.mcpServer.connect(transport);
      
      const sessionId = transport.sessionId;
      console.log(`[SSE] Created transport with session ID: ${sessionId}`);
      
      this.activeTransports.set(sessionId, transport);
      
      // cleanup when client disconnects
      req.on('close', () => {
        console.log(`[SSE] Client disconnected for session ID: ${sessionId}`);
        this.activeTransports.delete(sessionId);
        transport.close().catch(err => {
          console.error('[SSE] Error closing transport:', err);
        });
      });
    } catch (error) {
      console.error('[SSE] Error starting transport:', error);
      res.status(500).end('Internal Server Error');
    }
  }
  
  private async handleMessage(req: Request, res: Response): Promise<void> {
    const sessionId = req.query.sessionId as string;
    
    if (!sessionId) {
      res.status(400).json({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Missing sessionId parameter"
        },
        id: req.body?.id || null
      });
      return;
    }
    
    const transport = this.activeTransports.get(sessionId);
    
    if (!transport) {
      res.status(404).json({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: `No active session found for sessionId: ${sessionId}`
        },
        id: req.body?.id || null
      });
      return;
    }
    
    try {
      await transport.handlePostMessage(req, res, req.body);
    } catch (error: any) {
      console.error('[SSE] Error handling message:', error);
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal error",
          data: error.message
        },
        id: req.body?.id || null
      });
    }
  }
  
  public start(): void {
    this.server.listen(this.port, () => {
      console.log(`[SSE] MCP Server running with SDK transport on http://localhost:${this.port}`);
      console.log(`[SSE] - SSE endpoint: http://localhost:${this.port}/sse`);
      
      this.setupShutdownHandlers();
    });
  }
  
  private setupShutdownHandlers(): void {
    process.on("SIGINT", this.shutdown.bind(this));
    process.on("SIGTERM", this.shutdown.bind(this));
  }
  
  public shutdown(): void {
    console.log("[SSE] Shutting down server");
    this.server.close();
    process.exit(0);
  }
  
  public getActiveTransportsCount(): number {
    return this.activeTransports.size;
  }
}

// @ts-expect-error: injected by compiler
const mcpServer = INJECTED_MCP_SERVER as McpServer;

// Create and start the SSE transport
const sseTransport = new SSETransport(mcpServer);
sseTransport.start();