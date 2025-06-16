import { Request, Response, NextFunction, RequestHandler } from "express";

export interface ApiKeyAuthMiddlewareConfig {
  apiKey: string;
  headerName?: string;
}

export class ApiKeyAuthService {
  private apiKey: string;
  private headerName: string;

  constructor(config: ApiKeyAuthMiddlewareConfig) {
    this.apiKey = config.apiKey;
    this.headerName = config.headerName ?? "X-API-Key";
  }

  getMiddleware(): RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
      const apiKeyHeader = req.header(this.headerName);
      if (!apiKeyHeader || apiKeyHeader !== this.apiKey) {
        const error = new Error("Unauthorized: Missing or invalid API key");
        res.status(401).json({ error: error.message });
        return;
      }
      next();
    };
  }
}
