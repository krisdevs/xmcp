import express from "express";
import mcpHandler from "../.xmcp/adapter/adapter.js";

const app = express();
const port = 3000;

app.get("/mcp", mcpHandler);
app.post("/mcp", mcpHandler);

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});

export default app;
