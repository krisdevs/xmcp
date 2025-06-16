import { createServer } from "./server";
import { StatelessStreamableHTTPTransport } from "./stateless-streamable-http";
import { createJWTAuthMiddleware } from "../auth/jwt";

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
const jwtSecret = AUTH_JWT_SECRET as string;
// @ts-expect-error: injected by compiler
const jwtAlgorithm = AUTH_JWT_ALGORITHM as "HS256" | "RS256";

function main() {
  const options = {
    port,
    debug,
    bodySizeLimit,
    endpoint,
    stateless,
  };

  const authOptions = {
    secret: jwtSecret,
    algorithm: jwtAlgorithm,
  };

  const authMiddleware = createJWTAuthMiddleware(authOptions);

  // should validate for stateless but it is currently the only option supported
  const transport = new StatelessStreamableHTTPTransport(
    createServer,
    options,
    authMiddleware
  );
  transport.start();
}

main();
