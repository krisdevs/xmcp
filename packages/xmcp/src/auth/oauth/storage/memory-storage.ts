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

export class MemoryClientStorage implements ClientStorage {
  private clients = new Map<string, OAuthClient>();

  async getClient(clientId: string): Promise<OAuthClient | null> {
    return this.clients.get(clientId) || null;
  }

  async saveClient(client: OAuthClient): Promise<void> {
    this.clients.set(client.client_id, client);
  }

  async deleteClient(clientId: string): Promise<void> {
    this.clients.delete(clientId);
  }
}

export class MemoryTokenStorage implements TokenStorage {
  private tokens = new Map<string, AccessToken>();

  async getToken(token: string): Promise<AccessToken | null> {
    const accessToken = this.tokens.get(token);
    if (
      accessToken &&
      accessToken.expiresAt &&
      accessToken.expiresAt < new Date()
    ) {
      this.tokens.delete(token);
      return null;
    }
    return accessToken || null;
  }

  async saveToken(token: AccessToken): Promise<void> {
    this.tokens.set(token.token, token);
  }

  async deleteToken(token: string): Promise<void> {
    this.tokens.delete(token);
  }

  async deleteTokensByClient(clientId: string): Promise<void> {
    for (const [tokenValue, tokenData] of this.tokens.entries()) {
      if (tokenData.clientId === clientId) {
        this.tokens.delete(tokenValue);
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
