# Bundler context

This compiler folder is responsible for bundling the xmcp package.

The first step is to bundle the "runtime" folder info "dist/runtime".

The runtime folder contains the code that is used to start the http or stdio server.

After the runtime is compiled, the main xmcp code is bundled. `xmcp` runs a webpack compiler that will start on dist/runtime as entry point, but the runtime code imports user's code from the `src` folder. For exmaple, it imports the `tools` folder from the `src` folder.

To handle imports, it generates a `import-map.js` file that contains the paths to the user's code. So that runtime connects itslef with the user's code.

## xmcp Exports

the xmcp package exports are types that the user can use to type their tools and middleware.

It also exports all variables from "runtime-exports.ts" file.

## tsconfig.json

There is a general tsconfig.json file that is used to run typscript across the project.

`xmcp.tsconfig.json` is a special tsconfig.json file that is used to bundle the xmcp package. It only includes the entry files "src/index.ts" and "src/cli.ts" and the declaration file "src/declarations.d.ts".

The objetive is to avoid unwanted types from the source code such as the runtime to be included in the xmcp package.
