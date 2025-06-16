import { RequestHandler } from "express";
import { ApiKeyAuthService } from "../auth/api-key";
import { JWTAuthService } from "../auth/jwt";

// ------------------------------------------------------------
// Auth configuration has no default values, so we need to check if they are defined
// ------------------------------------------------------------

const jwtSecret =
  // @ts-expect-error: injected by compiler
  typeof AUTH_JWT_SECRET !== "undefined"
    ? // @ts-expect-error: injected by compiler
      (AUTH_JWT_SECRET as string)
    : undefined;
const jwtAlgorithm =
  // @ts-expect-error: injected by compiler
  typeof AUTH_JWT_ALGORITHM !== "undefined"
    ? // @ts-expect-error: injected by compiler
      (AUTH_JWT_ALGORITHM as "HS256" | "RS256")
    : undefined;

const apiKeySecret =
  // @ts-expect-error: injected by compiler
  typeof AUTH_API_KEY_SECRET !== "undefined"
    ? // @ts-expect-error: injected by compiler
      (AUTH_API_KEY_SECRET as string)
    : undefined;
const apiKeyHeaderName =
  // @ts-expect-error: injected by compiler
  typeof AUTH_API_KEY_HEADER_NAME !== "undefined"
    ? // @ts-expect-error: injected by compiler
      (AUTH_API_KEY_HEADER_NAME as string)
    : undefined;

const authType =
  // @ts-expect-error: injected by compiler
  typeof AUTH_TYPE !== "undefined"
    ? // @ts-expect-error: injected by compiler
      (AUTH_TYPE as "jwt" | "apiKey")
    : "none";

export function getAuthMiddleware(): RequestHandler | undefined {
  if (authType === "jwt") {
    if (!jwtSecret || !jwtAlgorithm) {
      throw new Error("JWT secret and algorithm are required");
    }
    return new JWTAuthService({
      secret: jwtSecret,
      algorithm: jwtAlgorithm,
    }).getMiddleware();
  } else if (authType === "apiKey") {
    if (!apiKeySecret || !apiKeyHeaderName) {
      throw new Error("API key secret and header name are required");
    }
    return new ApiKeyAuthService({
      apiKey: apiKeySecret,
      headerName: apiKeyHeaderName,
    }).getMiddleware();
  }
}
