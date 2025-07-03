import { RequestHandler } from "express";
import { createServer } from "../../utils/server";
import { StatelessStreamableHTTPTransport } from "./stateless-streamable-http";
import { OAuthConfigOptions } from "../../../auth/oauth/types";

// @ts-expect-error: injected by compiler
const port = HTTP_PORT as number;
// @ts-expect-error: injected by compiler
const debug = HTTP_DEBUG as boolean;
// @ts-expect-error: injected by compiler
const bodySizeLimit = HTTP_BODY_SIZE_LIMIT as string;
// @ts-expect-error: injected by compiler
const endpoint = HTTP_ENDPOINT as string;
// @ts-expect-error: injected by compiler
const stateless = HTTP_STATELESS as boolean;
// @ts-expect-error: injected by compiler
const middleware = INJECTED_MIDDLEWARE as () =>
  | Promise<{
      default: RequestHandler;
    }>
  | undefined;

// cors config
// @ts-expect-error: injected by compiler
const corsOrigin = HTTP_CORS_ORIGIN as string;
// @ts-expect-error: injected by compiler
const corsMethods = HTTP_CORS_METHODS as string;
// @ts-expect-error: injected by compiler
const corsAllowedHeaders = HTTP_CORS_ALLOWED_HEADERS as string;
// @ts-expect-error: injected by compiler
const corsExposedHeaders = HTTP_CORS_EXPOSED_HEADERS as string;
// @ts-expect-error: injected by compiler
const corsCredentials = HTTP_CORS_CREDENTIALS as boolean;
// @ts-expect-error: injected by compiler
const corsMaxAge = HTTP_CORS_MAX_AGE as number;

// oauth config
// @ts-expect-error: injected by compiler
const oauthConfig = OAUTH_CONFIG as OAuthConfigOptions | undefined;

async function main() {
  const options = {
    port,
    debug,
    bodySizeLimit,
    endpoint,
    stateless,
  };

  const corsOptions = {
    origin: corsOrigin,
    methods: corsMethods,
    allowedHeaders: corsAllowedHeaders,
    exposedHeaders: corsExposedHeaders,
    credentials: corsCredentials,
    maxAge: corsMaxAge,
  };

  let middlewareFn = undefined;

  if (middleware) {
    const middlewareModule = await middleware();
    if (
      middlewareModule &&
      middlewareModule.default &&
      typeof middlewareModule.default === "function"
    ) {
      middlewareFn = middlewareModule.default;
    } else {
      throw new Error(
        "Middleware module does not export a default RequestHandler"
      );
    }
  }

  // should validate for stateless but it is currently the only option supported
  const transport = new StatelessStreamableHTTPTransport(
    createServer,
    options,
    corsOptions,
    middlewareFn,
    oauthConfig
  );
  transport.start();
}

main();
