import { OAuthConfigOptions, OAuthProxyConfig } from "../types";

export function getOAuthConfig(
  config?: OAuthConfigOptions,
  defaultPort: number = 3001
): OAuthProxyConfig | null {
  if (config) {
    return {
      endpoints: config.endpoints,
      issuerUrl: config.issuerUrl,
      baseUrl: config.baseUrl,
      serviceDocumentationUrl: config.serviceDocumentationUrl,
      pathPrefix: config.pathPrefix || "/oauth2",
      defaultScopes: config.defaultScopes || ["openid", "profile", "email"],
    };
  }

  return null;
}
