import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt, { JwtPayload, VerifyOptions } from "jsonwebtoken";

export interface JWTAuthMiddlewareConfig extends VerifyOptions {
  secret: string;
}

/**
 * Middleware to authenticate requests using a JWT.
 * @param config - Configuration object containing the JWT secret and verify options.
 * @returns Express middleware function.
 *
 * @example
 * ```ts
 * const middleware = jwtAuthMiddleware({
 *   secret: process.env.JWT_SECRET!,
 *   algorithms: ["HS256"],
 *   issuer: "https://example.com",
 *   audience: "https://example.com",
 *   subject: "user-id",
 *   expiresIn: "1h",
 *   notBefore: "1h",
 *   clockTolerance: 30,
 * });
 * ```
 */
export function jwtAuthMiddleware(
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
      const { secret, ...verifyOptions } = config;
      const decoded = jwt.verify(token, secret, verifyOptions) as JwtPayload;
      (req as any).user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
    }
  };
}
