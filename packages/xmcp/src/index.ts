import { type z } from "zod";
import dotenv from "dotenv";
export { type Middleware } from "./types/middleware";
dotenv.config();

export type ToolSchema = Record<
  string,
  z.ZodType<unknown, z.ZodTypeDef, unknown>
>;

export type InferSchema<T extends ToolSchema> = {
  [K in keyof T]: z.infer<T[K]>;
};

export type { XmcpInputConfig as XmcpConfig } from "./compiler/parse-xmcp-config";
export { apiKeyAuthMiddleware } from "./auth/api-key";
export { jwtAuthMiddleware } from "./auth/jwt";
export type { OAuthConfigOptions } from "./auth/oauth";
import "./types/declarations";
