import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt, { JwtPayload, VerifyOptions } from "jsonwebtoken";

export interface JWTAuthMiddlewareConfig extends VerifyOptions {
  secret: string;
}

export class JWTAuthService {
  private config: JWTAuthMiddlewareConfig;

  constructor(config: JWTAuthMiddlewareConfig) {
    this.config = config;
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
        const { secret, ...verifyOptions } = this.config;

        const decoded = jwt.verify(token, secret, verifyOptions) as JwtPayload;
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
