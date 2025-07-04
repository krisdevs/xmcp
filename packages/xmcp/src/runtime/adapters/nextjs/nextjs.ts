import { createMcpHandler as createVercelMcpHandler } from "@vercel/mcp-adapter";
import {
  configureServer,
  INJECTED_CONFIG,
  loadTools,
} from "@/runtime/utils/server";

function mcpHandler(request: Request) {
  const [toolPromises, toolModules] = loadTools();

  Promise.all(toolPromises).then(() => {
    const requestHandler = createVercelMcpHandler((server) => {
      configureServer(server, toolModules);
    }, INJECTED_CONFIG);

    requestHandler(request);
  });
}

export default mcpHandler;
