import express from "express";
import { xmcpHandler } from "../.xmcp/adapter";

const app = express();
const port = 3002;

app.get("/mcp", xmcpHandler);
app.post("/mcp", xmcpHandler);

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});

export default app;
