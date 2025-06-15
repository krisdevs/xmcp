import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

export const mockJWTAuthConfig: JWTAuthMiddlewareConfig = {
  secret: "test_super_secret_1234567890",
  algorithm: "HS256",
  issuerBaseUrl: "https://test-issuer.example.com",
};

interface JWTAuthMiddlewareConfig {
  secret: string;
  algorithm: "HS256" | "RS256";
  issuerBaseUrl: string;
  audience?: string;
  logError?: (err: Error, context?: any) => void;
}

export function createJWTAuthMiddleware(
  config: JWTAuthMiddlewareConfig
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        error: "Unauthorized: Missing or malformed Authorization header",
      });
      return;
    }
    const token = authHeader.slice("Bearer ".length).trim();
    if (!token) {
      res.status(401).json({ error: "Unauthorized: Missing access token" });
      return;
    }
    try {
      const decoded = jwt.verify(token, config.secret, {
        algorithms: [config.algorithm],
        issuer: config.issuerBaseUrl,
        audience: config.audience,
      }) as JwtPayload;
      (req as any).user = decoded;
      next();
    } catch (err) {
      if (config.logError) config.logError(err as Error, { token });
      res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
    }
  };
}
