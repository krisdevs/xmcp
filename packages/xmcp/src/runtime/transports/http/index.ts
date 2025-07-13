import { RequestHandler } from "express";
import { createServer } from "../../utils/server";
import { StatelessStreamableHTTPTransport } from "./stateless-streamable-http";
import { OAuthConfigOptions } from "../../../auth/oauth/types";
import { Middleware } from "../../../types/middleware";

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
      default: Middleware;
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
// @ts-expect-error: injected by compiler
const host = HTTP_HOST as string;

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
    host,
  };

  const corsOptions = {
    origin: corsOrigin,
    methods: corsMethods,
    allowedHeaders: corsAllowedHeaders,
    exposedHeaders: corsExposedHeaders,
    credentials: corsCredentials,
    maxAge: corsMaxAge,
  };

  let middlewareFn: RequestHandler[] | undefined = undefined;

  if (middleware) {
    const middlewareModule = await middleware();
    if (middlewareModule && middlewareModule.default) {
      const defaultExport = middlewareModule.default;

      if (Array.isArray(defaultExport)) {
        // Handle array of middlewares
        middlewareFn = defaultExport.filter(
          (mw): mw is RequestHandler => typeof mw === "function"
        );
      } else if (typeof defaultExport === "function") {
        // Handle single middleware
        middlewareFn = [defaultExport];
      } else {
        throw new Error(
          "Middleware module does not export a valid RequestHandler or array of RequestHandlers"
        );
      }
    } else {
      throw new Error("Middleware module does not export a default middleware");
    }
  }

  // should validate for stateless but it is currently the only option supported
  const transport = new StatelessStreamableHTTPTransport(
    createServer,
    options,
    corsOptions,
    oauthConfig,
    middlewareFn
  );
  transport.start();
}

main();
