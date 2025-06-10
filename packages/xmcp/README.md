# XMCP

**The MCP Framework**

XMCP is a production-ready framework for building and shipping MCP applications. Designed with DX in mind, it streamlines development and lowers the barrier to entry for anyone looking to create and deploy powerful tools on top of the MCP ecosystem.

The framework handles complex tasks like transports, building and authentication, so developers can focus on what matters most: coding the tools, resources, or clients they want to bring to life.

## Features

- 🚀 **Hot Reloading** - Instant development feedback with automatic rebuilds
- 🔍 **Auto Discovery** - Tools are automatically discovered and registered
- 📝 **TypeScript First** - Full TypeScript support with type inference
- 🎯 **Schema Validation** - Built-in parameter validation with Zod
- 🛠️ **Rich Tooling** - Built-in CLI for development and building
- 🔌 **MCP Compatible** - Full compatibility with Model Context Protocol

## Quick Start

### Installation

```bash
npm install xmcp zod @modelcontextprotocol/sdk
```

### Create Your First Project

The fastest way to get started is with the project generator:

```bash
npx create-xmcp-app my-mcp-server
cd my-mcp-server
npm run dev
```

### Manual Setup

Create a basic project structure:

```
my-project/
├── src/
│   └── tools/
│       └── add.ts
├── package.json
└── tsconfig.json
```

Add the development and build scripts to your `package.json`:

```json
{
  "scripts": {
    "build": "xmcp build",
    "dev": "xmcp dev"
  }
}
```

## Creating Tools

XMCP tools follow a simple but powerful pattern, with separation of concerns as our premise. Each tool is a TypeScript file that exports exactly **three elements**:

### 1. Schema (Required)

Define the input parameters using Zod schemas:

```typescript
import { z } from "zod";

export const schema = {
  a: z.number().describe("First number to add"),
  b: z.number().describe("Second number to add"),
};
```

The schema object defines the tool's parameters with:

- **Key**: Parameter name
- **Value**: Zod schema with `.describe()` for documentation. This will be visibile through the inspector.
- **Purpose**: Type validation and automatic parameter documentation.

### 2. Metadata (Required)

Define the tool's identity and behavior hints:

```typescript
export const metadata = {
  name: "add",
  description: "Add two numbers together",
  annotations: {
    title: "Add Two Numbers", // Human-readable display name
    readOnlyHint: true, // true = doesn't modify external state
    destructiveHint: false, // true = performs destructive operations
    idempotentHint: true, // true = same inputs = same outputs
  },
};
```

The metadata object provides:

- **name**: Unique identifier for the tool
- **description**: Brief explanation of what the tool does
- **annotations**: Behavioral hints for AI models and UIs

This extends entirely from the MCP library.

### 3. Implementation (Required)

The default export function that performs the actual work:

```typescript
import { type InferSchema } from "xmcp";

export default async function add({ a, b }: InferSchema<typeof schema>) {
  return {
    content: [{ type: "text", text: String(a + b) }],
  };
}
```

The implementation function:

- **Parameters**: Automatically typed from your schema using the built-in `InferSchema`
- **Return**: MCP-compatible response with content array
- **Async**: Supports async operations for API calls, file I/O, etc.

## Complete Tool Example

Here's a complete tool file (`src/tools/add.ts`):

```typescript
import { z } from "zod";
import { type InferSchema } from "xmcp";

// 1. Schema - Define input parameters
export const schema = {
  a: z.number().describe("First number to add"),
  b: z.number().describe("Second number to add"),
};

// 2. Metadata - Define tool identity and hints
export const metadata = {
  name: "add",
  description: "Add two numbers together",
  annotations: {
    title: "Add Two Numbers",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

// 3. Implementation - The actual tool logic
export default async function add({ a, b }: InferSchema<typeof schema>) {
  return {
    content: [{ type: "text", text: String(a + b) }],
  };
}
```

## Development Commands

```bash
# Start development server with hot reloading
npm run dev

# Build for production
npm run build

# Start built server (stdio transport)
node dist/stdio.js

# Start built server (SSE transport)
node dist/sse.js
```

## Project Structure

```
your-project/
├── src/
│   └── tools/          # Tool files are auto-discovered here
│       ├── add.ts      # Your tools (each exports schema, metadata, default)
│       ├── multiply.ts
│       └── fetch.ts
├── dist/               # Built output (generated)
├── package.json
└── tsconfig.json
```

## Key Concepts

### Tool Discovery

- Tools are automatically discovered from the `src/tools/` directory
- Each `.ts` file becomes a tool
- No manual registration required

### Type Safety

- `InferSchema<typeof schema>` provides full TypeScript type inference
- Parameters are automatically validated against your Zod schemas
- Compile-time type checking for tool implementations

### MCP Compatibility

- Tools return MCP-compatible response objects
- Supports both `stdio` and `sse` transports
- Full compatibility with MCP clients and AI models

## Vercel Deployment

XMCP can be deployed to Vercel with the `--vercel` flag. This will create `.vercel` directory with the built output.

```bash
xmcp build --vercel
```

From the basement.
