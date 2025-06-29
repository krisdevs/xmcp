export interface OAuthClient {
  client_id: string;
  client_secret?: string;
  redirect_uris: string[];
  grant_types?: string[];
  response_types?: string[];
  scopes?: string[];
}

export interface AccessToken {
  token: string;
  clientId: string;
  scopes: string[];
  expiresAt?: Date;
  refreshToken?: string;
}

// Authorization codes are handled by external provider - not needed for proxy

export interface OAuthEndpoints {
  authorizationUrl: string;
  tokenUrl: string;
  revocationUrl?: string;
  userInfoUrl?: string;
  registerUrl: string; // DCR is mandatory
}

export interface OAuthError {
  error: string;
  error_description?: string;
  error_uri?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
}

// Storage interfaces for OAuth proxy (codes handled by external provider)
export interface OAuthStorage {
  clients: ClientStorage;
  tokens: TokenStorage;
}

export interface ClientStorage {
  getClient(clientId: string): Promise<OAuthClient | null>;
  saveClient(client: OAuthClient): Promise<void>;
  deleteClient(clientId: string): Promise<void>;
}

export interface TokenStorage {
  getToken(token: string): Promise<AccessToken | null>;
  saveToken(token: AccessToken): Promise<void>;
  deleteToken(token: string): Promise<void>;
  deleteTokensByClient(clientId: string): Promise<void>;
}

// Proxy provider configuration
export interface ProxyOAuthProviderConfig {
  endpoints: OAuthEndpoints;
  storage?: OAuthStorage;
  verifyAccessToken?: (token: string) => Promise<AccessToken>;
  // getClient removed - all clients must be registered through DCR
  issuerUrl?: string;
  defaultScopes?: string[];
}

// Router configuration
export interface OAuthRouterConfig {
  provider: ProxyOAuthServerProvider;
  issuerUrl: URL;
  baseUrl: URL;
  serviceDocumentationUrl?: URL;
  pathPrefix?: string;
}

export interface ProxyOAuthServerProvider {
  getClient(clientId: string): Promise<OAuthClient | null>;
  verifyAccessToken(token: string): Promise<AccessToken>;
  authorize(params: AuthorizeParams): Promise<string>;
  token(params: TokenParams): Promise<TokenResponse>;
  revoke(params: RevokeParams): Promise<void>;
  readonly endpoints: OAuthEndpoints;
}

export interface AuthorizeParams {
  response_type: string;
  client_id: string;
  redirect_uri: string;
  scope?: string;
  state?: string;
  // PKCE parameters (RFC 7636) - mandatory for security
  code_challenge: string;
  code_challenge_method: string;
}

export interface TokenParams {
  grant_type: string;
  client_id: string;
  client_secret?: string;
  code?: string;
  redirect_uri?: string;
  refresh_token?: string;
  // PKCE parameter (RFC 7636) - mandatory when using authorization_code grant
  code_verifier?: string;
}

export interface RevokeParams {
  token: string;
  token_type_hint?: string;
  client_id?: string;
  client_secret?: string;
}
