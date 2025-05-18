# XMCP Application

This project was created with [create-xmcp-app](https://github.com/basementstudio/xmcp).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

This will start the MCP server with both SSE and STDIO transport methods.

## MCP Server

The MCP server is defined in `src/index.ts`. Here's a simple example:

```typescript
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const server = new McpServer({
  name: "Demo",
  version: "1.0.0"
});

// Add an addition tool
server.tool("add",
  { a: z.number(), b: z.number() },
  async ({ a, b }) => ({
    content: [{ type: "text", text: String(a + b) }]
  })
);

// Add a dynamic greeting resource
server.resource(
  "greeting",
  new ResourceTemplate("greeting://{name}", { list: undefined }),
  async (uri, { name }) => ({
    contents: [{
      uri: uri.href,
      text: `Hello, ${name}!`
    }]
  })
);

export default server
```

## Building for Production

To build your project for production:

```bash
npm run build
# or
yarn build
# or
pnpm build
```

This will compile your TypeScript code and output it to the `dist` directory.

## Running in Production

To run your bundled MCP server in production:

```bash
npm run start-sse
# or
npm run start-stdio
```

## Learn More

- [XMCP Documentation](https://github.com/basementstudio/xmcp)