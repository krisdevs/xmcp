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

type ApiKeyAuthMiddlewareConfig = z.infer<
  typeof apiKeyAuthMiddlewareConfigSchema
>;

const errorMessage = "Unauthorized: Missing or invalid API key";

/**
 * Middleware to authenticate requests using an API key.
 * @param config - Configuration object containing either a static API key or a function to validate the API key.
 * @returns Express middleware function.
 *
 * @example
 * ```ts
 * const middleware = apiKeyAuthMiddleware({
 *   apiKey: process.env.API_KEY!,
 * });
 * ```
 *
 * @example
 * ```ts
 * const middleware = apiKeyAuthMiddleware({
 *   validateApiKey: async (key) => {
 *     return key === process.env.API_KEY!;
 *   },
 * });
 * ```
 */
export function apiKeyAuthMiddleware(
  config: ApiKeyAuthMiddlewareConfig
): RequestHandler {
  // To do, we can maybe work on better error handling here, like typing the error messages etc
  const { success, error } = apiKeyAuthMiddlewareConfigSchema.safeParse(config);
  if (!success) {
    throw new Error(error.message);
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
