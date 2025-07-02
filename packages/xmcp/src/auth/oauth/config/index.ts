import { OAuthConfigOptions, OAuthProxyConfig } from "../types";

export function getOAuthConfig(
  config?: OAuthConfigOptions,
  defaultPort: number = 3001
): OAuthProxyConfig | null {
  if (config) {
    const baseUrl = config.baseUrl || `http://127.0.0.1:${defaultPort}`;

    return {
      endpoints: config.endpoints,
      issuerUrl: config.issuerUrl,
      baseUrl,
      serviceDocumentationUrl: config.serviceDocumentationUrl,
      pathPrefix: config.pathPrefix || "/oauth2",
      defaultScopes: config.defaultScopes || ["openid", "profile", "email"],
    };
  }

  return null;
}
