import { RequestHandler } from "express";
import { ProxyOAuthServerProvider } from "./providers/proxy-provider";
import { createOAuthRouter, createOAuthMiddleware } from "./router";
import { MemoryOAuthStorage } from "./storage/memory-storage";
import {
  ProxyOAuthProviderConfig,
  OAuthRouterConfig,
  OAuthProxyConfig,
} from "./types";

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
