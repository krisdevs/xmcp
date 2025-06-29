import { Router, Request, Response, NextFunction } from "express";
import {
  OAuthRouterConfig,
  AuthorizeParams,
  TokenParams,
  RevokeParams,
  OAuthError,
  OAuthClient,
  ProxyOAuthServerProvider,
} from "./types";
import { createHash } from "crypto";

export function createOAuthRouter(config: OAuthRouterConfig): Router {
  const router = Router();
  const {
    provider,
    issuerUrl,
    baseUrl,
    serviceDocumentationUrl,
    pathPrefix = "/oauth2",
  } = config;

  // to do this actually should be done in the middleware, not the router
  // for testing purposes only
  router.use((req: Request, res: Response, next: NextFunction) => {
    // to do check: cors config from ts file is overriding and failing to add headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      // should also pass the mcp-protocol-version header
      // probably only that one since the rest can be set from the config side
      "Content-Type, Authorization, Accept, mcp-protocol-version"
    );
    res.setHeader("Access-Control-Expose-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }

    next();
  });

  // OAuth 2.0 Protected Resource Metadata (RFC 9728)
  router.get(
    "/.well-known/oauth-protected-resource",
    async (req: Request, res: Response) => {
      try {
        const baseUrlStr = baseUrl.toString().replace(/\/$/, ""); // Remove trailing slash - formatting issues lol
        // thinking of maybe removing the path prefix?
        const metadata = {
          resource: baseUrlStr,
          authorization_servers: [issuerUrl.toString()],
          bearer_methods_supported: ["header", "body"],
          resource_documentation: serviceDocumentationUrl?.toString(),
          introspection_endpoint: `${baseUrlStr}${pathPrefix}/introspect`,
          revocation_endpoint: `${baseUrlStr}${pathPrefix}/revoke`,
        };

        res.json(metadata);
      } catch (error) {
        console.error("Error in protected resource metadata endpoint:", error);
        res.status(500).json({
          error: "server_error",
          error_description: "Internal server error",
        });
      }
    }
  );

  // OAuth 2.0 Discovery endpoint - authorization server metadata RFC 8414
  // maybe serve all the config as customizable? for example for scopes etc
  router.get(
    "/.well-known/oauth-authorization-server",
    async (req: Request, res: Response) => {
      try {
        const discovery = {
          issuer: issuerUrl.toString(),
          authorization_endpoint: provider.endpoints.authorizationUrl,
          token_endpoint: provider.endpoints.tokenUrl,
          revocation_endpoint: provider.endpoints.revocationUrl,
          response_types_supported: ["code"],
          grant_types_supported: ["authorization_code", "refresh_token"],
          token_endpoint_auth_methods_supported: [
            "client_secret_post",
            "client_secret_basic",
          ],
          scopes_supported: ["openid", "profile", "email"],
          // PKCE support (RFC 7636) - S256 mandatory for security
          code_challenge_methods_supported: ["S256"],
          // DCR is mandatory - all clients must register
          // this is what MCP recommends doing to handle the entire OAuth flow
          // cause we're not supporting manually setting up the client
          registration_endpoint: `${baseUrl.toString().replace(/\/$/, "")}${pathPrefix}/register`,
          ...(serviceDocumentationUrl && {
            service_documentation: serviceDocumentationUrl.toString(),
          }),
        };

        res.json(discovery);
      } catch (error) {
        console.error("Error in discovery endpoint:", error);
        res.status(500).json({
          error: "server_error",
          error_description: "Internal server error",
        });
      }
    }
  );

  // following endpoints we're redirecting to the external authorization server
  router.get(`${pathPrefix}/authorize`, async (req: Request, res: Response) => {
    try {
      const params: AuthorizeParams = {
        response_type: req.query.response_type as string,
        client_id: req.query.client_id as string,
        redirect_uri: req.query.redirect_uri as string,
        scope: req.query.scope as string,
        state: req.query.state as string,
        // PKCE parameters (RFC 7636)
        code_challenge: req.query.code_challenge as string,
        code_challenge_method: req.query.code_challenge_method as string,
      };

      if (!params.response_type || !params.client_id || !params.redirect_uri) {
        res.status(400).json({
          error: "invalid_request",
          error_description: "Missing required parameters",
        });
        return;
      }

      // PKCE params validation
      if (!params.code_challenge || !params.code_challenge_method) {
        res.status(400).json({
          error: "invalid_request",
          error_description:
            "PKCE parameters (code_challenge, code_challenge_method) are required",
        });
        return;
      }

      // only allow S256 method
      if (params.code_challenge_method !== "S256") {
        res.status(400).json({
          error: "invalid_request",
          error_description: "Only S256 code challenge method is supported",
        });
        return;
      }

      const authUrl = await provider.authorize(params);

      res.redirect(authUrl);
    } catch (error) {
      console.error("Error in authorize endpoint:", error);
      const oauthError = extractOAuthError(error);
      res.status(400).json(oauthError);
    }
  });

  router.post(`${pathPrefix}/token`, async (req: Request, res: Response) => {
    try {
      const params: TokenParams = {
        grant_type: req.body.grant_type,
        client_id: req.body.client_id,
        client_secret: req.body.client_secret,
        code: req.body.code,
        redirect_uri: req.body.redirect_uri,
        refresh_token: req.body.refresh_token,
        // PKCE parameter (RFC 7636)
        code_verifier: req.body.code_verifier,
      };

      if (!params.grant_type || !params.client_id) {
        res.status(400).json({
          error: "invalid_request",
          error_description: "Missing required parameters",
        });
        return;
      }

      // PKCE is mandatory for authorization_code grant
      if (params.grant_type === "authorization_code" && !params.code_verifier) {
        res.status(400).json({
          error: "invalid_request",
          error_description:
            "code_verifier is required for authorization_code grant (PKCE)",
        });
        return;
      }

      const tokenResponse = await provider.token(params);

      res.json(tokenResponse);
    } catch (error) {
      console.error("Error in token endpoint:", error);
      const oauthError = extractOAuthError(error);
      res.status(400).json(oauthError);
    }
  });

  router.post(`${pathPrefix}/revoke`, async (req: Request, res: Response) => {
    try {
      const params: RevokeParams = {
        token: req.body.token,
        token_type_hint: req.body.token_type_hint,
        client_id: req.body.client_id,
        client_secret: req.body.client_secret,
      };

      if (!params.token) {
        res.status(400).json({
          error: "invalid_request",
          error_description: "Missing token parameter",
        });
        return;
      }

      await provider.revoke(params);

      res.status(200).end();
    } catch (error) {
      console.error("Error in revoke endpoint:", error);
      const oauthError = extractOAuthError(error);
      res.status(400).json(oauthError);
    }
  });

  router.post(
    `${pathPrefix}/introspect`,
    async (req: Request, res: Response) => {
      try {
        const token = req.body.token;

        if (!token) {
          res.status(400).json({
            error: "invalid_request",
            error_description: "Missing token parameter",
          });
          return;
        }

        const accessToken = await provider.verifyAccessToken(token);

        res.json({
          active: true,
          client_id: accessToken.clientId,
          scope: accessToken.scopes.join(" "),
          exp: accessToken.expiresAt
            ? Math.floor(accessToken.expiresAt.getTime() / 1000)
            : undefined,
        });
      } catch (error) {
        console.error("Error in introspect endpoint:", error);
        // return active: false for invalid tokens
        res.json({ active: false });
      }
    }
  );

  // dynamic client registration endpoint - check for existing client first, then register if needed
  // DCR is mandatory - no fallback needed since registerUrl is required
  router.all(`${pathPrefix}/register`, async (req: Request, res: Response) => {
    try {
      if (req.method === "GET") {
        // For GET requests, just redirect to the external provider's registration page
        res.redirect(provider.endpoints.registerUrl);
        return;
      }

      // For POST requests, implement proper DCR deduplication logic
      const registrationRequest = req.body;

      const platformId = generatePlatformId(registrationRequest);

      const existingClient = await findExistingClientByPlatform(
        provider,
        platformId,
        registrationRequest
      );

      if (existingClient) {
        // return the existing client information in DCR response format
        const response = {
          client_id: existingClient.client_id,
          client_secret: existingClient.client_secret,
          redirect_uris: existingClient.redirect_uris,
          grant_types: existingClient.grant_types || ["authorization_code"],
          response_types: existingClient.response_types || ["code"],
          scope: existingClient.scopes
            ? existingClient.scopes.join(" ")
            : "openid profile email",
        };

        res.json(response);
        return;
      }

      // no existing client found, proceed with new registration

      const response = await fetch(provider.endpoints.registerUrl, {
        method: req.method,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(req.headers["user-agent"] && {
            "User-Agent": req.headers["user-agent"] as string,
          }),
        },
        body: JSON.stringify(registrationRequest),
      });

      const registrationData = await response.json();

      if (!response.ok) {
        res.status(response.status).json(registrationData);
        return;
      }

      // if registration was successful, store the client with platform identifier
      if (registrationData.client_id) {
        const client = {
          client_id: registrationData.client_id,
          client_secret: registrationData.client_secret,
          redirect_uris: registrationData.redirect_uris || [],
          grant_types: registrationData.grant_types || ["authorization_code"],
          response_types: registrationData.response_types || ["code"],
          scopes: registrationData.scope
            ? registrationData.scope.split(" ")
            : ["openid", "profile", "email"],
          platform_id: platformId,
        };

        await provider.saveClient(client);
      }

      res.json(registrationData);
    } catch (error) {
      console.error("Error in registration endpoint:", error);
      res.status(500).json({
        error: "server_error",
        error_description: "Failed to register client",
      });
    }
  });

  return router;
}

/**
 * Generate a platform identifier from the registration request
 * This is used to identify if a client for this platform already exists
 */
function generatePlatformId(registrationRequest: any): string {
  // Use a combination of redirect_uris and client_name to create a platform ID
  // this ensures clients with the same configuration are treated as the same platform
  // to do check: maybe use a set of all fields that are relevant to the client or are provided by registration, not just redirect_uris
  const redirect_uris = Array.isArray(registrationRequest.redirect_uris)
    ? registrationRequest.redirect_uris.sort().join(",")
    : "";
  const client_name = registrationRequest.client_name || "";

  const platformData = `${redirect_uris}|${client_name}`;
  return createHash("sha256")
    .update(platformData)
    .digest("hex")
    .substring(0, 16);
}

/**
 * Find an existing client by platform identifier and matching metadata
 */
async function findExistingClientByPlatform(
  provider: ProxyOAuthServerProvider,
  platformId: string,
  registrationRequest: any
): Promise<OAuthClient | null> {
  try {
    const memoryStorage = (provider as any).storage;
    if (!memoryStorage || !memoryStorage.clients) {
      return null;
    }

    const clientsMap = (memoryStorage.clients as any).clients;
    if (!clientsMap || typeof clientsMap.values !== "function") {
      return null;
    }

    for (const client of clientsMap.values()) {
      if (client.platform_id === platformId) {
        if (clientMatchesRegistrationRequest(client, registrationRequest)) {
          return client;
        }
      }

      // Also check for clients that match the configuration but don't have platform_id set
      // (for backwards compatibility)
      if (
        !client.platform_id &&
        clientMatchesRegistrationRequest(client, registrationRequest)
      ) {
        // update the client to include the platform_id for future lookups
        client.platform_id = platformId;
        await provider.saveClient(client);
        return client;
      }
    }

    return null;
  } catch (error) {
    console.error("Error finding existing client:", error);
    return null;
  }
}

/**
 * Check if an existing client matches the registration request
 */
function clientMatchesRegistrationRequest(
  client: OAuthClient,
  registrationRequest: any
): boolean {
  // Compare key fields to see if this is the same client configuration
  const requestUris = Array.isArray(registrationRequest.redirect_uris)
    ? registrationRequest.redirect_uris.sort()
    : [];
  const clientUris = Array.isArray(client.redirect_uris)
    ? client.redirect_uris.sort()
    : [];

  if (requestUris.length !== clientUris.length) {
    return false;
  }

  for (let i = 0; i < requestUris.length; i++) {
    if (requestUris[i] !== clientUris[i]) {
      return false;
    }
  }

  // additional checks could include client_name, grant_types, etc. TBD
  // actually it should probably go over all the fields and check if they match
  return true;
}

// create middleware for protecting routes
export function createOAuthMiddleware(provider: any) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.header("Authorization");

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({
          error: "invalid_token",
          error_description: "Missing or malformed Authorization header",
        });
        return;
      }

      const token = authHeader.slice("Bearer ".length).trim();

      if (!token) {
        res.status(401).json({
          error: "invalid_token",
          error_description: "Missing access token",
        });
        return;
      }

      const accessToken = await provider.verifyAccessToken(token);

      (req as any).oauth = {
        token: accessToken.token,
        clientId: accessToken.clientId,
        scopes: accessToken.scopes,
        expiresAt: accessToken.expiresAt,
      };

      next();
    } catch (error) {
      console.error("Error in OAuth middleware:", error);
      res.status(401).json({
        error: "invalid_token",
        error_description: "Invalid or expired token",
      });
    }
  };
}

// helper function to extract OAuth errors pretty self explanatory
function extractOAuthError(error: any): OAuthError {
  if (error && error.oauth) {
    return error.oauth;
  }

  return {
    error: "server_error",
    error_description: error?.message || "Internal server error",
  };
}
