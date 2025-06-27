/**
 * This script builds the compiler. It's not the compiler itself
 * */

import path from "path";
import ForkTsCheckerWebpackPlugin from "fork-ts-checker-webpack-plugin";
import nodeExternals from "webpack-node-externals";
import { CleanWebpackPlugin } from "clean-webpack-plugin";
import webpack from "webpack";
import type { Configuration, EntryObject } from "webpack";
import { outputPath, runtimeOutputPath } from "./constants";
import { srcPath } from "./constants";

const mode =
  process.env.NODE_ENV === "production" ? "production" : "development";

/** Since we are using webpack to build webpack, we need to exclude some modules */
const libsToExcludeFromCompilation = [
  "webpack",
  "webpack-virtual-modules",
  "webpack-node-externals",
  "ts-loader",
  "fork-ts-checker-webpack-plugin",
];

/** Each key here must correspond to a file in the runtime folder
 * ej: "headers" -> "/runtime/headers.ts"
 */
const runtimeExportedRoots = ["headers", "stdio", "sse", "streamable-http"];

const entry: EntryObject = {
  // stdio: path.join(srcPath, "runtime", "stdio.ts"),
  // sse: path.join(srcPath, "runtime", "sse.ts"),
  // "streamable-http": path.join(srcPath, "runtime", "streamable-http.ts"),
};

// add dynamic entries
for (const root of runtimeExportedRoots) {
  entry[root] = path.join(srcPath, "runtime", `${root}.ts`);
}

const config: Configuration = {
  entry,
  mode: "production",
  devtool: false,
  target: "node",
  externalsPresets: { node: true },
  externals: [
    nodeExternals({
      allowlist: (modulePath) => {
        return !libsToExcludeFromCompilation.includes(modulePath);
      },
    }),
    // // Make runtime-exports an external dependency to avoid duplication
    // function (data, callback) {
    //   for (const root of runtimeExportedRoots) {
    //     if (data.request?.endsWith(`/${root}`)) {
    //       console.log(data.request);
    //       return callback(null, `commonjs2 ./${root}.js`);
    //     }
    //   }
    //   callback();
    //   // if (
    //   //   data.request?.endsWith("runtime-exports")
    //   // ) {
    //   //   return callback(null, "commonjs2 ./runtime-exports.js");
    //   // }
    //   // callback();
    // },
  ],
  output: {
    filename: "[name].js",
    path: runtimeOutputPath,
    globalObject: "this",
    library: {
      type: "umd",
    },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: "swc-loader",
          options: {
            jsc: {
              parser: {
                syntax: "typescript",
                tsx: false,
                decorators: true,
              },
              target: "es2020",
            },
            module: {
              type: "es6",
            },
          },
        },
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".jsx", ".js", ".json"],
  },
  watchOptions: {
    aggregateTimeout: 600,
    ignored: /node_modules/,
  },
  optimization: {
    minimize: true,
    splitChunks: {
      chunks: "all",
      cacheGroups: {
        shared: {
          name: "shared",
          minChunks: 2,
          priority: 10,
          reuseExistingChunk: true,
          enforce: true,
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true,
        },
      },
    },
  },
  plugins: [
    new ForkTsCheckerWebpackPlugin(),
    new CleanWebpackPlugin({
      cleanStaleWebpackAssets: false,
      cleanOnceBeforeBuildPatterns: [outputPath],
    }),
  ],
  watch: mode === "development",
};

// Fix issues with importing unsupported fsevents module in Windows and Linux
// For more info, see: https://github.com/vinceau/project-clippi/issues/48
if (process.platform !== "darwin") {
  config.plugins?.push(
    new webpack.IgnorePlugin({
      resourceRegExp: /^fsevents$/,
    })
  );
}

let compileStarted = false;

// ✨
export function buildRuntime(onCompiled: (stats: any) => void) {
  webpack(config, (err, stats) => {
    if (err) {
      console.error(err);
    }

    if (stats?.hasErrors()) {
      console.error(
        stats.toString({
          colors: true,
          chunks: false,
        })
      );
      return;
    }

    console.log(
      stats?.toString({
        colors: true,
        chunks: false,
      })
    );

    if (compileStarted) {
      return;
    } else {
      compileStarted = true;
      onCompiled(stats);
    }
  });
}
