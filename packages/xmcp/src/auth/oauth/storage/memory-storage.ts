import { OAuthStorage, TokenStorage, AccessToken } from "../types";

/**
 * Memory storage for OAuth tokens only
 *
 * This is a simple in-memory storage implementation for OAuth tokens. Used for development and testing.
 * It is not suitable for production environments. Should be warned against using it in production when building or deploying the app.
 * Specially since deploying in Vercel is a serverless environment and the memory storage won't persist.
 */

// Module-level storage map that persists across instances (SINGLETON PATTERN)
const tokensMap = new Map<string, AccessToken>();

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
  public tokens: TokenStorage;

  constructor() {
    this.tokens = new MemoryTokenStorage();
  }
}
