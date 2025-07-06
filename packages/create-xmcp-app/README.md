<div align="center">
  <a href="https://xmcp.dev">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://assets.basehub.com/bf7c3bb1/303b8a62053c9d86ca3b972b5597ab5c/x.png">
      <img alt="xmcp logo" src="https://assets.basehub.com/bf7c3bb1/303b8a62053c9d86ca3b972b5597ab5c/x.png" height="128">
    </picture>
  </a>
  <h1>xmcp</h1>

<a href="https://basement.studio"><img alt="xmcp logo" src="https://img.shields.io/badge/MADE%20BY%20basement.studio-000000.svg?style=for-the-badge&labelColor=000"></a>
<a href="https://www.npmjs.com/package/create-xmcp-app"><img alt="NPM version" src="https://img.shields.io/npm/v/xmcp.svg?style=for-the-badge&labelColor=000000"></a>
<a href="https://github.com/basementstudio/xmcp/blob/main/license.md"><img alt="License" src="https://img.shields.io/npm/l/xmcp.svg?style=for-the-badge&labelColor=000000"></a>

</div>

# create-xmcp-app

The easiest way to get started with `xmcp` is by using `create-xmcp-app`. This CLI tool allows you to scaffold a template project with all the necessary files and dependencies to get you up and running quickly.

## Usage

```bash
npx create-xmcp-app@latest
```

You will be asked for the project name and then guided through a series of prompts to configure your project.

## Options

- `-y, --yes`: Skip all confirmation prompts and use defaults
- `--use-npm`: Use npm as package manager (default)
- `--use-yarn`: Use yarn as package manager
- `--use-pnpm`: Use pnpm as package manager
- `--skip-install`: Skip installing dependencies
- `--vercel`: Add Vercel support for deployment
- `--http`: Enable HTTP transport
- `--stdio`: Enable STDIO transport
