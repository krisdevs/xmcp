import {
  OAuthStorage,
  ClientStorage,
  TokenStorage,
  OAuthClient,
  AccessToken,
} from "../types";

/**
 * Memory storage for OAuth
 *
 * This is a simple in-memory storage implementation for OAuth. Used for development and testing.
 * It is not suitable for production environments. Should be warned against using it in production when building or deploying the app.
 * Specially since deploying in Vercel is a serverless environment and the memory storage won't persist.
 */

// Module-level storage maps that persist across instances (SINGLETON PATTERN)
const clientsMap = new Map<string, OAuthClient>();
const tokensMap = new Map<string, AccessToken>();

export class MemoryClientStorage implements ClientStorage {
  // instead of instance level otherwise it will be a new instance for each request
  public clients = clientsMap; // exposing for access

  async getClient(clientId: string): Promise<OAuthClient | null> {
    return clientsMap.get(clientId) || null;
  }

  async saveClient(client: OAuthClient): Promise<void> {
    clientsMap.set(client.client_id, client);
  }

  async deleteClient(clientId: string): Promise<void> {
    clientsMap.delete(clientId);
  }
}

export class MemoryTokenStorage implements TokenStorage {
  // same, module level map
  public tokens = tokensMap;

  async getToken(token: string): Promise<AccessToken | null> {
    const accessToken = tokensMap.get(token);
    if (
      accessToken &&
      accessToken.expiresAt &&
      accessToken.expiresAt < new Date()
    ) {
      tokensMap.delete(token);
      return null;
    }
    return accessToken || null;
  }

  async saveToken(token: AccessToken): Promise<void> {
    tokensMap.set(token.token, token);
  }

  async deleteToken(token: string): Promise<void> {
    tokensMap.delete(token);
  }

  async deleteTokensByClient(clientId: string): Promise<void> {
    for (const [tokenValue, tokenData] of tokensMap.entries()) {
      if (tokenData.clientId === clientId) {
        tokensMap.delete(tokenValue);
      }
    }
  }
}

export class MemoryOAuthStorage implements OAuthStorage {
  public clients: ClientStorage;
  public tokens: TokenStorage;

  constructor() {
    this.clients = new MemoryClientStorage();
    this.tokens = new MemoryTokenStorage();
  }
}
