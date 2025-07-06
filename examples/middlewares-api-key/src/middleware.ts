import { apiKeyAuthMiddleware } from "xmcp";

export default apiKeyAuthMiddleware({
  headerName: "x-api-key",
  validateApiKey: async (apiKey) => {
    return apiKey === process.env.API_KEY!;
  },
  // or `apiKey: process.env.API_KEY` To set a static key
});
