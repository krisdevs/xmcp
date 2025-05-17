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

const mode = process.env.NODE_ENV === 'production' ? 'production' : 'development'

/** Since we are using webpack to build webpack, we need to exclude some modules */
const libsToExcludeFromCompilation = [
  "webpack",
  "webpack-virtual-modules",
  "webpack-node-externals",
  "ts-loader",
  "fork-ts-checker-webpack-plugin"
]

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const srcPath = path.join(__dirname, "..", "src")
const outputPath = path.join(__dirname, "..", "dist")

const config: Configuration = {
  entry: {
    index: path.join(srcPath, "index.ts"),
    cli: path.join(srcPath, "cli.ts")
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
    path: outputPath,
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
export function buildMain() {
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
  })
}
