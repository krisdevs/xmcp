import fs from "fs";
import path from "path";
import { z } from "zod";

export const DEFAULT_HTTP_PORT = 3002;
export const DEFAULT_HTTP_BODY_SIZE_LIMIT = 1024 * 1024 * 10; // 10MB
export const DEFAULT_HTTP_ENDPOINT = "/mcp";
export const DEFAULT_HTTP_STATELESS = true;

// cors config schema
const corsConfigSchema = z.object({
  origin: z.union([z.string(), z.array(z.string()), z.boolean()]).optional(),
  methods: z.union([z.string(), z.array(z.string())]).optional(),
  allowedHeaders: z.union([z.string(), z.array(z.string())]).optional(),
  exposedHeaders: z.union([z.string(), z.array(z.string())]).optional(),
  credentials: z.boolean().optional(),
  maxAge: z.number().optional(),
});

const configSchema = z.object({
  stdio: z.boolean().optional(),
  http: z
    .union([
      z.boolean(),
      z.object({
        port: z.number().default(DEFAULT_HTTP_PORT),
        bodySizeLimit: z.number().default(DEFAULT_HTTP_BODY_SIZE_LIMIT),
        debug: z.boolean().default(false),
        endpoint: z.string().default(DEFAULT_HTTP_ENDPOINT),
        stateless: z.boolean().default(DEFAULT_HTTP_STATELESS),
        cors: corsConfigSchema.optional(),
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
      stdio: true,
      http: true,
    };
  }
  return validateConfig(JSON.parse(content));
}
