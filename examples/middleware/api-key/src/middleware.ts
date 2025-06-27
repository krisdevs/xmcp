import { ApiKeyAuthMiddleware } from "xmcp";

export default ApiKeyAuthMiddleware({
  apiKey: process.env.API_KEY!,
  headerName: "x-api-key",
});
