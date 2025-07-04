import { createMcpHandler as createVercelMcpHandler } from "@vercel/mcp-adapter";
import {
  configureServer,
  INJECTED_CONFIG,
  loadTools,
} from "@/runtime/utils/server";

async function mcpHandler(request: Request) {
  const [toolPromises, toolModules] = loadTools();

  await Promise.all(toolPromises);

  const requestHandler = createVercelMcpHandler((server) => {
    configureServer(server, toolModules);
  }, INJECTED_CONFIG);

  return requestHandler(request);
}

export default mcpHandler;
