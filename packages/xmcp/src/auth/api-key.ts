import { Request, Response, NextFunction, RequestHandler } from "express";

interface StaticApiKeyAuthMiddlewareConfig {
  //** HTTP header name to look for the API key in */
  headerName?: string;
  //** The API key to validate */
  apiKey: string;
}

interface DynamicApiKeyAuthMiddlewareConfig {
  //** HTTP header name to look for the API key in */
  headerName?: string;
  //** A function to validate the API key */
  validateApiKey: (key: string) => Promise<boolean>;
}

const errorMessage = "Unauthorized: Missing or invalid API key";

export function apiKeyAuthMiddleware(
  config: StaticApiKeyAuthMiddlewareConfig | DynamicApiKeyAuthMiddlewareConfig
): RequestHandler {
  const headerName = config.headerName ?? "x-api-key";
  const apiKey = "apiKey" in config ? config.apiKey : undefined;
  const validateApiKey =
    "validateApiKey" in config ? config.validateApiKey : undefined;

  return async (req: Request, res: Response, next: NextFunction) => {
    const apiKeyHeader = req.header(headerName);
    if (!apiKeyHeader) {
      res.status(401).json({ error: errorMessage });
      return;
    }
    if ("apiKey" in config && apiKeyHeader !== apiKey) {
      res.status(401).json({ error: errorMessage });
      return;
    }
    if (validateApiKey) {
      const isValid = await validateApiKey(apiKeyHeader);
      if (!isValid) {
        res.status(401).json({ error: errorMessage });
        return;
      }
    }
    next();
  };
}
