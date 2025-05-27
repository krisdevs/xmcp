# create-xmcp-app

Create Next-MCP applications with one command.

## Usage

```bash
npx create-xmcp-app@latest my-app
# or
yarn create xmcp-app my-app
# or
pnpm create xmcp-app my-app
```

## Options

- `-y, --yes`: Skip all confirmation prompts and use defaults
- `-t, --typescript`: Use TypeScript (default)
- `--use-npm`: Use npm as package manager (default)
- `--use-yarn`: Use yarn as package manager
- `--use-pnpm`: Use pnpm as package manager
- `--local`: Use the local next-mcp package instead of downloading from npm (for development)

## Commands

Once your app is created, you can run the following commands:

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

## Local Development

- Build the package: `pnpm build`
- Link it for usage: `pnpm link --global`

* You may need to grant permissions.
