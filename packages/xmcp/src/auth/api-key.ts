import { Request, Response, NextFunction, RequestHandler } from "express";
import { z } from "zod";

const apiKeyAuthMiddlewareConfigSchema = z
  .object({
    apiKey: z.string().optional(),
    headerName: z.string().optional(),
    validateApiKey: z
      .function()
      .args(z.string())
      .returns(z.promise(z.boolean()))
      .optional(),
  })
  .strict()
  .refine(
    (config) =>
      config.apiKey !== undefined || config.validateApiKey !== undefined,
    {
      message: "Either 'apiKey' or 'validateApiKey' must be provided",
    }
  )
  .refine(
    (config) =>
      !(config.apiKey !== undefined && config.validateApiKey !== undefined),
    {
      message:
        "'apiKey' and 'validateApiKey' are mutually exclusive - provide only one",
    }
  );

const errorMessage = "Unauthorized: Missing or invalid API key";

type StaticApiKeyConfig = {
  /** The static API key to validate against */
  apiKey: string;
  /** Optional header name to read the API key from. Defaults to 'x-api-key' */
  headerName?: string;
};

type CustomValidationConfig = {
  /** Optional header name to read the API key from. Defaults to 'x-api-key' */
  headerName?: string;
  /** Custom validation function that receives the API key and returns a Promise<boolean> */
  validateApiKey: (key: string) => Promise<boolean>;
};

export function apiKeyAuthMiddleware(
  config: StaticApiKeyConfig
): RequestHandler;

export function apiKeyAuthMiddleware(
  config: CustomValidationConfig
): RequestHandler;

export function apiKeyAuthMiddleware(
  config: StaticApiKeyConfig | CustomValidationConfig
): RequestHandler {
  // To do, we can maybe work on better error handling here, like typing the error messages etc
  const { success, error } = apiKeyAuthMiddlewareConfigSchema.safeParse(config);
  if (!success) {
    const hasApiKey = "apiKey" in config;
    const hasValidateApiKey = "validateApiKey" in config;

    if (hasApiKey && hasValidateApiKey) {
      throw new Error(
        "'apiKey' and 'validateApiKey' are mutually exclusive - provide only one"
      );
    } else if (!hasApiKey && !hasValidateApiKey) {
      throw new Error("Either 'apiKey' or 'validateApiKey' must be provided");
    } else {
      throw new Error(`Invalid configuration: ${error.message}`);
    }
  }

  const headerName = config.headerName ?? "x-api-key";
  const apiKey = "apiKey" in config ? config.apiKey : undefined;
  const validateApiKey =
    "validateApiKey" in config ? config.validateApiKey : undefined;

  return async (req: Request, res: Response, next: NextFunction) => {
    const apiKeyHeader = req.header(headerName);
    if (!apiKeyHeader) {
      res.status(401).json({ error: errorMessage });
      return;
    }
    if ("apiKey" in config && apiKeyHeader !== apiKey) {
      res.status(401).json({ error: errorMessage });
      return;
    }
    if (validateApiKey) {
      const isValid = await validateApiKey(apiKeyHeader);
      if (!isValid) {
        res.status(401).json({ error: errorMessage });
        return;
      }
    }
    next();
  };
}
