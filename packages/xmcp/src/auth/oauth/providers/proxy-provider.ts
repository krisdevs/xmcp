import {
  ProxyOAuthServerProvider as IProxyOAuthServerProvider,
  ProxyOAuthProviderConfig,
  OAuthClient,
  AccessToken,
  AuthorizeParams,
  TokenParams,
  RevokeParams,
  TokenResponse,
  OAuthError,
  OAuthStorage,
} from "../types";
import { MemoryOAuthStorage } from "../storage/memory-storage";

export class ProxyOAuthServerProvider implements IProxyOAuthServerProvider {
  private config: ProxyOAuthProviderConfig;
  private storage: OAuthStorage;

  constructor(config: ProxyOAuthProviderConfig) {
    this.config = config;

    // fallback to memory storage
    // ideally this would be used in a development environment, could be set with a flag
    // since we are providing storage on Redis (to do) we may want to fallback to this in dev
    // does not scale to prod tho, so we should be validating that we prevent that from happening
    this.storage = config.storage || new MemoryOAuthStorage();
  }

  // Expose config for router access
  get endpoints() {
    return this.config.endpoints;
  }

  async getClient(clientId: string): Promise<OAuthClient | null> {
    // only accept clients that were registered through DCR
    // all clients must exist in storage (no hardcoded clients allowed)
    return await this.storage.clients.getClient(clientId);
  }

  async saveClient(client: OAuthClient): Promise<void> {
    // store client after registration (if not already in storage)
    return await this.storage.clients.saveClient(client);
  }

  async verifyAccessToken(token: string): Promise<AccessToken> {
    // Use custom verifyAccessToken function if provided

    /* custom verifyAccessToken example:
    
        verifyAccessToken: async (token) => {
            return {
                token,
                clientId: "123",
                scopes: ["openid", "email", "profile"],
            }
        }
    */

    if (this.config.verifyAccessToken) {
      return await this.config.verifyAccessToken(token);
    }

    // Fallback to storage lookup or external verification
    const storedToken = await this.storage.tokens.getToken(token);
    if (storedToken) {
      return storedToken;
    }

    // If not found in storage, verify with external provider
    return await this.verifyTokenWithProvider(token);
  }

  async authorize(params: AuthorizeParams): Promise<string> {
    const { client_id, redirect_uri, response_type, scope, state } = params;

    // Validate client
    const client = await this.getClient(client_id);
    if (!client) {
      throw new Error("Invalid client");
    }

    // Validate redirect URI
    if (!client.redirect_uris.includes(redirect_uri)) {
      throw new Error("Invalid redirect URI");
    }

    // Build authorization URL for external provider
    const authUrl = new URL(this.config.endpoints.authorizationUrl);
    authUrl.searchParams.set("response_type", response_type);
    authUrl.searchParams.set("client_id", client_id);
    authUrl.searchParams.set("redirect_uri", redirect_uri);

    if (scope) {
      authUrl.searchParams.set("scope", scope);
    } else if (this.config.defaultScopes) {
      authUrl.searchParams.set("scope", this.config.defaultScopes.join(" "));
    }

    if (state) {
      authUrl.searchParams.set("state", state);
    }

    return authUrl.toString();
  }

  async token(params: TokenParams): Promise<TokenResponse> {
    const {
      grant_type,
      client_id,
      client_secret,
      code,
      redirect_uri,
      refresh_token,
    } = params;

    // Validate client
    const client = await this.getClient(client_id);
    if (!client) {
      throw this.createOAuthError("invalid_client", "Invalid client");
    }

    try {
      // Forward token request to external provider
      const response = await fetch(this.config.endpoints.tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: new URLSearchParams({
          grant_type,
          client_id,
          ...(client_secret && { client_secret }),
          ...(code && { code }),
          ...(redirect_uri && { redirect_uri }),
          ...(refresh_token && { refresh_token }),
        }),
      });

      const tokenData = await response.json();

      if (!response.ok) {
        throw this.createOAuthError(
          tokenData.error || "server_error",
          tokenData.error_description || "Token exchange failed"
        );
      }

      // Store token in our storage if we have access_token
      if (tokenData.access_token) {
        const accessToken: AccessToken = {
          token: tokenData.access_token,
          clientId: client_id,
          scopes: tokenData.scope ? tokenData.scope.split(" ") : [],
          expiresAt: tokenData.expires_in
            ? new Date(Date.now() + tokenData.expires_in * 1000)
            : undefined,
          refreshToken: tokenData.refresh_token,
        };

        await this.storage.tokens.saveToken(accessToken);
      }

      return tokenData as TokenResponse;
    } catch (error) {
      if (error instanceof Error && error.message.includes("invalid_")) {
        throw error;
      }
      throw this.createOAuthError("server_error", "Failed to exchange token");
    }
  }

  async revoke(params: RevokeParams): Promise<void> {
    const { token, token_type_hint, client_id, client_secret } = params;

    // Remove from our storage first
    await this.storage.tokens.deleteToken(token);

    // If external provider supports revocation, forward the request
    if (this.config.endpoints.revocationUrl) {
      try {
        const response = await fetch(this.config.endpoints.revocationUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
          },
          body: new URLSearchParams({
            token,
            ...(token_type_hint && { token_type_hint }),
            ...(client_id && { client_id }),
            ...(client_secret && { client_secret }),
          }),
        });

        if (!response.ok) {
          console.warn(
            "Failed to revoke token with external provider:",
            response.statusText
          );
        }
      } catch (error) {
        console.warn("Error revoking token with external provider:", error);
      }
    }
  }

  private async verifyTokenWithProvider(token: string): Promise<AccessToken> {
    // If external provider has a userinfo endpoint, we can use it to verify the token
    if (this.config.endpoints.userInfoUrl) {
      try {
        const response = await fetch(this.config.endpoints.userInfoUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (response.ok) {
          // Token is valid, create a basic AccessToken object
          return {
            token,
            clientId: "external", // We might not know the exact client ID
            scopes: [], // We might not know the exact scopes
          };
        }
      } catch (error) {
        console.warn("Error verifying token with external provider:", error);
      }
    }

    throw this.createOAuthError("invalid_token", "Token verification failed");
  }

  private createOAuthError(error: string, description?: string): Error {
    const oauthError: OAuthError = {
      error,
      error_description: description,
    };

    const errorObj = new Error(description || error);
    (errorObj as any).oauth = oauthError;
    return errorObj;
  }
}
