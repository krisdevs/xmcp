import { apiKeyAuthMiddleware } from "xmcp";

export default apiKeyAuthMiddleware({
  apiKey: process.env.API_KEY!,
  headerName: "x-api-key",
});
