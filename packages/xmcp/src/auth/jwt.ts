import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

export interface JWTAuthMiddlewareConfig {
  secret: string;
  algorithm: "HS256" | "RS256";
}

export class JWTAuthService {
  private secret: string;
  private algorithm: "HS256" | "RS256";

  constructor(config: JWTAuthMiddlewareConfig) {
    this.secret = config.secret;
    this.algorithm = config.algorithm;
  }

  getMiddleware(): RequestHandler {
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
        const decoded = jwt.verify(token, this.secret, {
          algorithms: [this.algorithm],
        }) as JwtPayload;
        (req as any).user = decoded;
        next();
      } catch (err) {
        res
          .status(401)
          .json({ error: "Unauthorized: Invalid or expired token" });
      }
    };
  }
}
