import fs from "fs";
import path from "path";
import { z } from "zod";

export const DEFAULT_SSE_PORT = 3001;
export const DEFAULT_SSE_BODY_SIZE_LIMIT = 1024 * 1024 * 10; // 10MB

export const DEFAULT_STREAMABLE_HTTP_PORT = 3002;
export const DEFAULT_STREAMABLE_HTTP_BODY_SIZE_LIMIT = 1024 * 1024 * 10; // 10MB
export const DEFAULT_STREAMABLE_HTTP_ENDPOINT = "/mcp";
export const DEFAULT_STREAMABLE_HTTP_STATELESS = true;

const configSchema = z.object({
  sse: z
    .union([
      z.boolean(),
      z.object({
        port: z.number().default(DEFAULT_SSE_PORT),
        bodySizeLimit: z.number().default(DEFAULT_SSE_BODY_SIZE_LIMIT),
      }),
    ])
    .optional(),
  stdio: z.boolean().optional(),
  "streamable-http": z
    .union([
      z.boolean(),
      z.object({
        port: z.number().default(DEFAULT_STREAMABLE_HTTP_PORT),
        bodySizeLimit: z
          .number()
          .default(DEFAULT_STREAMABLE_HTTP_BODY_SIZE_LIMIT),
        debug: z.boolean().default(false),
        endpoint: z.string().default(DEFAULT_STREAMABLE_HTTP_ENDPOINT),
        stateless: z.boolean().default(DEFAULT_STREAMABLE_HTTP_STATELESS),
      }),
    ])
    .optional(),
  auth: z
    .union([
      z.object({
        jwt: z.object({
          secret: z.string(),
          algorithm: z.enum(["HS256", "RS256"]).default("HS256"),
        }),
      }),
      z.object({
        apiKey: z.object({
          secret: z.string(),
          headerName: z.string().default("X-API-Key"),
        }),
      }),
    ])
    .optional(),
  webpack: z.function().args(z.any()).returns(z.any()).optional(),
});

export type XmcpConfig = z.infer<typeof configSchema>;

function validateConfig(config: unknown): XmcpConfig {
  return configSchema.parse(config);
}

// read if exists
function readConfigFile(pathToConfig: string): string | null {
  const configPath = path.resolve(process.cwd(), pathToConfig);
  if (!fs.existsSync(configPath)) {
    return null;
  }
  return fs.readFileSync(configPath, "utf8");
}

// parse and validate config
export function getConfig(configFilePath: string): XmcpConfig {
  const content = readConfigFile(configFilePath);

  if (!content) {
    return {
      sse: true,
      stdio: true,
      "streamable-http": true,
    };
  }
  return validateConfig(JSON.parse(content));
}
