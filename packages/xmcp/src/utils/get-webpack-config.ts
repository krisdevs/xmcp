import { Compiler, Configuration, DefinePlugin, ProvidePlugin } from "webpack";
import path from "path";
import { outputPath, runtimeFolderPath } from "./constants";
import fs from "fs-extra";
import nodeExternals from "webpack-node-externals";
import { CompilerMode } from "..";
import {
  DEFAULT_SSE_BODY_SIZE_LIMIT,
  DEFAULT_SSE_PORT,
  DEFAULT_STREAMABLE_HTTP_PORT,
  DEFAULT_STREAMABLE_HTTP_BODY_SIZE_LIMIT,
  DEFAULT_STREAMABLE_HTTP_ENDPOINT,
  DEFAULT_STREAMABLE_HTTP_STATELESS,
  XmcpConfig,
} from "./parse-config";

export function getWebpackConfig(
  mode: CompilerMode,
  xmcpConfig: XmcpConfig
): Configuration {
  const processFolder = process.cwd();
  const config: Configuration = {
    mode,
    watch: mode === "development",
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
      extensions: [".tsx", ".ts", ".jsx", ".js", ".json"],
    },
    plugins: [new InjectRuntimePlugin()],
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: "swc-loader",
        },
      ],
    },
  };

  const providedPackages = {
    // connects the user exports with our runtime
    INJECTED_TOOLS: [
      path.resolve(processFolder, ".xmcp/import-map.js"),
      "default",
    ],
  };

  // thsi will inject definitions for the following variables when bundling the code
  const definedVariables: Record<string, string | number | boolean> = {};

  // add entry points based on config
  const entry: Configuration["entry"] = {};
  if (xmcpConfig.stdio) {
    // setup entry point
    entry.stdio = path.join(runtimeFolderPath, "stdio.js");
  }
  if (xmcpConfig.sse) {
    // setup entry point
    entry.sse = path.join(runtimeFolderPath, "sse.js");
    // define variables
    definedVariables.SSE_DEBUG = mode === "development";
    if (typeof xmcpConfig.sse === "object") {
      definedVariables.SSE_PORT = xmcpConfig.sse.port;
      definedVariables.SSE_BODY_SIZE_LIMIT = JSON.stringify(
        xmcpConfig.sse.bodySizeLimit
      );
    } else {
      // sse config is boolean
      definedVariables.SSE_PORT = DEFAULT_SSE_PORT;
      definedVariables.SSE_BODY_SIZE_LIMIT = JSON.stringify(
        DEFAULT_SSE_BODY_SIZE_LIMIT
      );
    }
  }
  if (xmcpConfig["streamable-http"]) {
    // setup entry point
    entry["streamable-http"] = path.join(
      runtimeFolderPath,
      "streamable-http.js"
    );
    // define variables
    definedVariables.STREAMABLE_HTTP_DEBUG = mode === "development";
    if (typeof xmcpConfig["streamable-http"] === "object") {
      definedVariables.STREAMABLE_HTTP_PORT =
        xmcpConfig["streamable-http"].port;
      definedVariables.STREAMABLE_HTTP_BODY_SIZE_LIMIT = JSON.stringify(
        xmcpConfig["streamable-http"].bodySizeLimit
      );
      definedVariables.STREAMABLE_HTTP_ENDPOINT = JSON.stringify(
        xmcpConfig["streamable-http"].endpoint
      );
      definedVariables.STREAMABLE_HTTP_STATELESS =
        xmcpConfig["streamable-http"].stateless;
    } else {
      // streamableHttp config is boolean
      definedVariables.STREAMABLE_HTTP_PORT = DEFAULT_STREAMABLE_HTTP_PORT;
      definedVariables.STREAMABLE_HTTP_BODY_SIZE_LIMIT = JSON.stringify(
        DEFAULT_STREAMABLE_HTTP_BODY_SIZE_LIMIT
      );
      definedVariables.STREAMABLE_HTTP_ENDPOINT = JSON.stringify(
        DEFAULT_STREAMABLE_HTTP_ENDPOINT
      );
      definedVariables.STREAMABLE_HTTP_STATELESS =
        DEFAULT_STREAMABLE_HTTP_STATELESS;
    }
  }
  if (xmcpConfig.auth) {
    // define variables
    if (typeof xmcpConfig.auth === "object" && "jwt" in xmcpConfig.auth) {
      // it has set up jwt auth
      definedVariables.AUTH_JWT_SECRET = JSON.stringify(
        xmcpConfig.auth.jwt.secret
      );
      definedVariables.AUTH_JWT_ALGORITHM = JSON.stringify(
        xmcpConfig.auth.jwt.algorithm
      );
    } else if (
      typeof xmcpConfig.auth === "object" &&
      "apiKey" in xmcpConfig.auth
    ) {
      // it has set up api key auth
      definedVariables.AUTH_API_KEY_SECRET = JSON.stringify(
        xmcpConfig.auth.apiKey.secret
      );
      definedVariables.AUTH_API_KEY_HEADER_NAME = JSON.stringify(
        xmcpConfig.auth.apiKey.headerName
      );
    }
  }
  config.entry = entry;

  // add injected variables to config
  config.plugins!.push(new ProvidePlugin(providedPackages));

  // add defined variables to config
  config.plugins!.push(new DefinePlugin(definedVariables));

  return config;
}

class InjectRuntimePlugin {
  apply(compiler: Compiler) {
    let hasRun = false;
    compiler.hooks.beforeCompile.tap(
      "InjectRuntimePlugin",
      (_compilationParams) => {
        if (hasRun) return;
        hasRun = true;
        fs.writeFileSync(
          path.join(runtimeFolderPath, "stdio.js"),
          // @ts-expect-error: injected by compiler
          RUNTIME_STDIO
        );
        // @ts-expect-error: injected by compiler
        fs.writeFileSync(path.join(runtimeFolderPath, "sse.js"), RUNTIME_SSE);
        fs.writeFileSync(
          path.join(runtimeFolderPath, "streamable-http.js"),
          // @ts-expect-error: injected by compiler
          RUNTIME_STREAMABLE_HTTP
        );
      }
    );
  }
}
