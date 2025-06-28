import { Compiler, Configuration, DefinePlugin, ProvidePlugin } from "webpack";
import path from "path";
import { outputPath, runtimeFolderPath } from "./constants";
import fs from "fs-extra";
import nodeExternals from "webpack-node-externals";
import { type CompilerMode } from "../compile";
import {
  DEFAULT_STREAMABLE_HTTP_PORT,
  DEFAULT_STREAMABLE_HTTP_BODY_SIZE_LIMIT,
  DEFAULT_STREAMABLE_HTTP_ENDPOINT,
  DEFAULT_STREAMABLE_HTTP_STATELESS,
  XmcpConfig,
} from "./parse-config";

// Add this type for local use
type CorsConfig = {
  origin?: string | string[] | boolean;
  methods?: string | string[];
  allowedHeaders?: string | string[];
  exposedHeaders?: string | string[];
  credentials?: boolean;
  maxAge?: number;
};

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
    externals: [
      nodeExternals({
        allowlist: ["xmcp/headers"],
      }),
    ],
    resolve: {
      fallback: {
        process: false,
      },
      alias: {
        "node:process": "process",
        "xmcp/headers": path.resolve(processFolder, ".xmcp/headers.js"),
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
      "tools",
    ],
    INJECTED_MIDDLEWARE: [
      path.resolve(processFolder, ".xmcp/import-map.js"),
      "middleware",
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
  if (xmcpConfig["streamable-http"]) {
    // setup entry point
    entry["streamable-http"] = path.join(runtimeFolderPath, "http.js");
    // define variables
    definedVariables.STREAMABLE_HTTP_DEBUG = mode === "development";
    let cors: CorsConfig = {};
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
      cors = xmcpConfig["streamable-http"].cors || {};
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
      cors = {};
    }
    // inject cors
    definedVariables.STREAMABLE_HTTP_CORS_ORIGIN = JSON.stringify(
      cors.origin ?? ""
    );
    definedVariables.STREAMABLE_HTTP_CORS_METHODS = JSON.stringify(
      cors.methods ?? ""
    );
    definedVariables.STREAMABLE_HTTP_CORS_ALLOWED_HEADERS = JSON.stringify(
      cors.allowedHeaders ?? ""
    );
    definedVariables.STREAMABLE_HTTP_CORS_EXPOSED_HEADERS = JSON.stringify(
      cors.exposedHeaders ?? ""
    );
    definedVariables.STREAMABLE_HTTP_CORS_CREDENTIALS =
      typeof cors.credentials === "boolean" ? cors.credentials : false;
    definedVariables.STREAMABLE_HTTP_CORS_MAX_AGE =
      typeof cors.maxAge === "number" ? cors.maxAge : 0;
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

        // @ts-expect-error: injected by compiler
        const runtimeFiles = RUNTIME_FILES as Record<string, string>;

        for (const [fileName, fileContent] of Object.entries(runtimeFiles)) {
          fs.writeFileSync(path.join(runtimeFolderPath, fileName), fileContent);
        }
      }
    );
  }
}
