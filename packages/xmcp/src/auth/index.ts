import { RequestHandler } from "express";
import { ApiKeyAuthService, ApiKeyAuthMiddlewareConfig } from "../auth/api-key";
import { JWTAuthService, JWTAuthMiddlewareConfig } from "../auth/jwt";

// Utility to get JWT middleware
export function JWTAuthMiddleware(
  config: JWTAuthMiddlewareConfig
): RequestHandler {
  return new JWTAuthService(config).getMiddleware();
}

// Utility to get API Key middleware
export function ApiKeyAuthMiddleware(
  config: ApiKeyAuthMiddlewareConfig
): RequestHandler {
  return new ApiKeyAuthService(config).getMiddleware();
}
