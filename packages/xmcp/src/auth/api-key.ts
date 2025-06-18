import { Request, Response, NextFunction, RequestHandler } from "express";

export interface ApiKeyAuthMiddlewareConfig {
  apiKey: string;
  headerName?: string;
}

export function ApiKeyAuthMiddleware(
  config: ApiKeyAuthMiddlewareConfig
): RequestHandler {
  const apiKey = config.apiKey;
  const headerName = config.headerName ?? "X-API-Key";

  return (req: Request, res: Response, next: NextFunction) => {
    const apiKeyHeader = req.header(headerName);
    if (!apiKeyHeader || apiKeyHeader !== apiKey) {
      const error = new Error("Unauthorized: Missing or invalid API key");
      res.status(401).json({ error: error.message });
      return;
    }
    next();
  };
}
