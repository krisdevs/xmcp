import { RequestHandler } from "express";
import { ProxyOAuthServerProvider } from "./providers/proxy-provider";
import { createOAuthRouter, createOAuthMiddleware } from "./router";
import { MemoryOAuthStorage } from "./storage/memory-storage";
import {
  ProxyOAuthProviderConfig,
  OAuthRouterConfig,
  OAuthStorage,
  OAuthEndpoints,
} from "./types";

export interface OAuthProxyConfig {
  // External OAuth provider endpoints - to do probably extend from MCP SDK config
  endpoints: OAuthEndpoints;

  // base config
  issuerUrl: string;
  baseUrl: string;
  serviceDocumentationUrl?: string;
  pathPrefix?: string;

  // Storage configuration (optional, defaults to memory)
  // redis storage to do
  storage?: OAuthStorage;

  // custom verification functions (optional, in case we need to override the default, otherwise default to the provider)
  verifyAccessToken?: (token: string) => Promise<any>;
  // getClient removed - all clients must be registered through DCR

  // default scopes
  defaultScopes?: string[];
}

/**
 * Creates an OAuth proxy setup
 */
export function createOAuthProxy(config: OAuthProxyConfig) {
  // Create provider with configuration
  const providerConfig: ProxyOAuthProviderConfig = {
    endpoints: config.endpoints,
    storage: config.storage || new MemoryOAuthStorage(),
    verifyAccessToken: config.verifyAccessToken,
    defaultScopes: config.defaultScopes,
  };

  const provider = new ProxyOAuthServerProvider(providerConfig);

  // Create router configuration
  const routerConfig: OAuthRouterConfig = {
    provider,
    issuerUrl: new URL(config.issuerUrl),
    baseUrl: new URL(config.baseUrl),
    serviceDocumentationUrl: config.serviceDocumentationUrl
      ? new URL(config.serviceDocumentationUrl)
      : undefined,
    pathPrefix: config.pathPrefix,
  };

  const router = createOAuthRouter(routerConfig);
  const middleware = createOAuthMiddleware(provider);

  return {
    provider,
    router,
    middleware,

    // helper methods
    setupWithApp: (app: any) => {
      app.use(router);
      return {
        protect: middleware,
      };
    },
  };
}
