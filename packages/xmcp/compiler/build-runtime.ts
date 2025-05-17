/**
 * This script builds the compiler. It's not the compiler itself
 * */

import path from "path"
import ForkTsCheckerWebpackPlugin from "fork-ts-checker-webpack-plugin"
import nodeExternals from "webpack-node-externals"
import { CleanWebpackPlugin } from "clean-webpack-plugin"
import webpack from "webpack"
import type { Configuration } from "webpack"
import { fileURLToPath } from "url"
import { outputPath, runtimeOutputPath } from "./constants"
import { srcPath } from "./constants"

const mode = process.env.NODE_ENV === 'production' ? 'production' : 'development'

/** Since we are using webpack to build webpack, we need to exclude some modules */
const libsToExcludeFromCompilation = [
  "webpack",
  "webpack-virtual-modules",
  "webpack-node-externals",
  "ts-loader",
  "fork-ts-checker-webpack-plugin"
]


const config: Configuration = {
  entry: {
    stdio: path.join(srcPath, "runtime", "stdio.ts"),
    sse: path.join(srcPath, "runtime", "sse.ts"),
  },
  mode,
  devtool: mode === 'production' ? false : 'source-map',
  target: "node",
  externalsPresets: { node: true },
  externals: [nodeExternals({
    allowlist: (modulePath) => {
      return !(libsToExcludeFromCompilation.includes(modulePath));
    }
  })],
  output: {
    filename: "[name].js",
    path: runtimeOutputPath,
    globalObject: "this",
    library: {
      type: "umd",
    }
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: 'swc-loader',
          options: {
            jsc: {
              parser: {
                syntax: 'typescript',
                tsx: false,
                decorators: true
              },
              target: 'es2020'
            },
            module: {
              type: 'es6'
            }
          }
        }
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
  },
  watchOptions: {
    aggregateTimeout: 600,
    ignored: /node_modules/,
  },
  optimization: {
    minimize: mode === 'production'
  },
  plugins: [
    new ForkTsCheckerWebpackPlugin(),
    new CleanWebpackPlugin({
      cleanStaleWebpackAssets: false,
      cleanOnceBeforeBuildPatterns: [outputPath],
    }),
    // new CopyPlugin({
    //   patterns: [
    //     { from: path.resolve(__dirname, "src/static"), to: path.resolve(__dirname, "dist/static") },
    //   ],
    // }),
  ],
  watch: mode === 'development'
}


// Fix issues with importing unsupported fsevents module in Windows and Linux
// For more info, see: https://github.com/vinceau/project-clippi/issues/48
if (process.platform !== "darwin") {
  config.plugins?.push(
    new webpack.IgnorePlugin({
      resourceRegExp: /^fsevents$/,
    })
  );
}

// ✨
export function buildRuntime(onCompiled: (stats: any) => void) {
  webpack(config, (err, stats) => {
    if (err) {
      console.error(err)
    }

    if (stats?.hasErrors()) {
      console.error(stats.toString({
        colors: true,
        chunks: false
      }))
      return
    }

    console.log(stats?.toString({
      colors: true,
      chunks: false
    }))

    onCompiled(stats)
  })
}
