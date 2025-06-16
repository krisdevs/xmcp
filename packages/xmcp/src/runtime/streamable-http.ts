import { RequestHandler } from "express";
import { createServer } from "./server";
import { StatelessStreamableHTTPTransport } from "./stateless-streamable-http";
import { RequestHandler } from "express";
import { getAuthMiddleware } from "../auth";

// @ts-expect-error: injected by compiler
const port = STREAMABLE_HTTP_PORT as number;
// @ts-expect-error: injected by compiler
const debug = STREAMABLE_HTTP_DEBUG as boolean;
// @ts-expect-error: injected by compiler
const bodySizeLimit = STREAMABLE_HTTP_BODY_SIZE_LIMIT as string;
// @ts-expect-error: injected by compiler
const endpoint = STREAMABLE_HTTP_ENDPOINT as string;
// @ts-expect-error: injected by compiler
const stateless = STREAMABLE_HTTP_STATELESS as boolean;
// @ts-expect-error: injected by compiler
const middleware = INJECTED_MIDDLEWARE as () =>
  | Promise<{
      default: RequestHandler;
    }>
  | undefined;

async function main() {
  const options = {
    port,
    debug,
    bodySizeLimit,
    endpoint,
    stateless,
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
    middlewareFn
  );
  transport.start();
}

main();
