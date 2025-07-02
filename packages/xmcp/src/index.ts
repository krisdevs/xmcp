import { type z } from "zod";
import dotenv from "dotenv";
export { type Middleware } from "./types/middleware";
dotenv.config();

export type InferSchema<T extends Record<string, z.ZodType>> = {
  [K in keyof T]: z.infer<T[K]>;
};

export type { XmcpInputConfig as XmcpConfig } from "./utils/parse-config";
export { apiKeyAuthMiddleware } from "./auth/api-key";
export { jwtAuthMiddleware } from "./auth/jwt";
import "./declarations.ts";
