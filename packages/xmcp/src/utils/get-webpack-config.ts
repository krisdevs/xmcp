import { Compiler, Configuration, DefinePlugin, ProvidePlugin } from "webpack";
import path from "path";
import { outputPath, runtimeFolderPath } from "./constants";
import fs from "fs-extra";
import nodeExternals from "webpack-node-externals";
import { type CompilerMode } from "../compile";
import {
  DEFAULT_HTTP_PORT,
  DEFAULT_HTTP_BODY_SIZE_LIMIT,
  DEFAULT_HTTP_ENDPOINT,
  DEFAULT_HTTP_STATELESS,
  XmcpParsedConfig,
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
  xmcpConfig: XmcpParsedConfig
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
  if (xmcpConfig["http"]) {
    // setup entry point
    entry["http"] = path.join(runtimeFolderPath, "http.js");
    // define variables
    definedVariables.HTTP_DEBUG = mode === "development";
    let cors: CorsConfig = {};
    if (typeof xmcpConfig["http"] === "object") {
      definedVariables.HTTP_PORT = xmcpConfig["http"].port;
      definedVariables.HTTP_BODY_SIZE_LIMIT = JSON.stringify(
        xmcpConfig["http"].bodySizeLimit
      );
      definedVariables.HTTP_ENDPOINT = JSON.stringify(
        xmcpConfig["http"].endpoint
      );
      definedVariables.HTTP_STATELESS = DEFAULT_HTTP_STATELESS;
      cors = xmcpConfig["http"].cors || {};
    } else {
      // http config is boolean
      definedVariables.HTTP_PORT = DEFAULT_HTTP_PORT;
      definedVariables.HTTP_BODY_SIZE_LIMIT = JSON.stringify(
        DEFAULT_HTTP_BODY_SIZE_LIMIT
      );
      definedVariables.HTTP_ENDPOINT = JSON.stringify(DEFAULT_HTTP_ENDPOINT);
      definedVariables.HTTP_STATELESS = DEFAULT_HTTP_STATELESS;
      cors = {};
    }
    // inject cors
    definedVariables.HTTP_CORS_ORIGIN = JSON.stringify(cors.origin ?? "");
    definedVariables.HTTP_CORS_METHODS = JSON.stringify(cors.methods ?? "");
    definedVariables.HTTP_CORS_ALLOWED_HEADERS = JSON.stringify(
      cors.allowedHeaders ?? ""
    );
    definedVariables.HTTP_CORS_EXPOSED_HEADERS = JSON.stringify(
      cors.exposedHeaders ?? ""
    );
    definedVariables.HTTP_CORS_CREDENTIALS =
      typeof cors.credentials === "boolean" ? cors.credentials : false;
    definedVariables.HTTP_CORS_MAX_AGE =
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
