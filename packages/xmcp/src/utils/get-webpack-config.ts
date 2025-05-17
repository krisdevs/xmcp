import { Compiler, Configuration, ProvidePlugin } from "webpack"
import path from "path"
import { outputPath, runtimeFolderPath } from "./constants"
import { CleanWebpackPlugin } from "clean-webpack-plugin"
import fs from "fs-extra"

export function getWebpackConfig(mode: "development" | "production"): Configuration {
  const processFolder = process.cwd()
  return {
    mode,
    entry: {
      stdio: path.join(runtimeFolderPath, "stdio.js"),
      sse: path.join(runtimeFolderPath, "sse.js"),
    },
    output: {
      filename: "[name].js",
      path: outputPath,
      libraryTarget: "commonjs2",
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
    compiler.hooks.beforeCompile.tap('InjectRuntimePlugin', (_compilationParams) => {
      // @ts-expect-error: injected by compiler
      fs.writeFileSync(path.join(runtimeFolderPath, 'stdio.js'), RUNTIME_STDIO)
      // @ts-expect-error: injected by compiler
      fs.writeFileSync(path.join(runtimeFolderPath, 'sse.js'), RUNTIME_SSE)
    })
  }
}
