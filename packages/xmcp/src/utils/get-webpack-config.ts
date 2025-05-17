import { Compiler, Configuration, ProvidePlugin } from "webpack"
import path from "path"
import { outputPath, runtimeFolderPath } from "./constants"
import { CleanWebpackPlugin } from "clean-webpack-plugin"
import fs from "fs-extra"
import nodeExternals from "webpack-node-externals"

export function getWebpackConfig(mode: "development" | "production"): Configuration {
  const processFolder = process.cwd()
  return {
    mode,
    watch: mode === "development",
    entry: {
      stdio: path.join(runtimeFolderPath, "stdio.js"),
      sse: path.join(runtimeFolderPath, "sse.js"),
    },
    output: {
      filename: "[name].js",
      path: outputPath,
      libraryTarget: "commonjs2",
    },
    target: "node",
    externals: [nodeExternals()],
    resolve: {
      fallback: {
        process: false,
      },
      alias: {
        "node:process": "process",
      },
    },
    plugins: [
      new CleanWebpackPlugin({
        cleanStaleWebpackAssets: false,
        cleanOnceBeforeBuildPatterns: [outputPath],
      }),
      new InjectRuntimePlugin(),
      new ProvidePlugin({
        INJECTED_MCP_SERVER: [path.resolve(processFolder, 'src/index.ts'), 'default'],
      }),
    ]
  }
}

class InjectRuntimePlugin {
  apply(compiler: Compiler) {
    let hasRun = false
    compiler.hooks.beforeCompile.tap('InjectRuntimePlugin', (_compilationParams) => {
      if (hasRun) return
      hasRun = true
      // @ts-expect-error: injected by compiler
      fs.writeFileSync(path.join(runtimeFolderPath, 'stdio.js'), RUNTIME_STDIO)
      // @ts-expect-error: injected by compiler
      fs.writeFileSync(path.join(runtimeFolderPath, 'sse.js'), RUNTIME_SSE)
    })
  }
}
