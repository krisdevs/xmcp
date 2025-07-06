import { XmcpConfig } from "xmcp";

const config: XmcpConfig = {
  http: {
    port: 3002,
  },
  experimental: {
    oauth: {
      baseUrl: "https://my-app.com",
      issuerUrl: "https://my-app.com",
      defaultScopes: ["openid", "profile", "email"],
      pathPrefix: "/oauth2",
      endpoints: {
        authorizationUrl: "https://auth-provider.com/oauth/authorize",
        tokenUrl: "https://auth-provider.com/oauth/token",
        registerUrl: "https://auth-provider.com/oauth/register",
      },
    },
  },
};

export default config;
