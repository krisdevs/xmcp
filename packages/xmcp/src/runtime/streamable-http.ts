import { createServer } from "./server";
import { StatelessStreamableHTTPTransport } from "./stateless-streamable-http";
import { createJWTAuthMiddleware, mockJWTAuthConfig } from "../auth/jwt";

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
const authType = AUTH_TYPE as "jwt" | "apiKey" | "none";
// @ts-expect-error: injected by compiler
const jwtSecret = JWT_SECRET as string;
// @ts-expect-error: injected by compiler
const jwtAlgorithm = JWT_ALGORITHM as string;
// @ts-expect-error: injected by compiler
const issuerBaseUrl = ISSUER_BASE_URL as string;
// @ts-expect-error: injected by compiler
const audience = AUDIENCE as string;

function main() {
  const options = {
    port,
    debug,
    bodySizeLimit,
    endpoint,
    stateless,
  };

  const authMiddleware = createJWTAuthMiddleware({
    secret: mockJWTAuthConfig.secret,
    algorithm: mockJWTAuthConfig.algorithm,
    issuerBaseUrl: mockJWTAuthConfig.issuerBaseUrl,
    audience: mockJWTAuthConfig.audience,
  });

  // should validate for stateless but it is currently the only option supported
  const transport = new StatelessStreamableHTTPTransport(
    createServer,
    options,
    authMiddleware
  );
  transport.start();
}

main();
