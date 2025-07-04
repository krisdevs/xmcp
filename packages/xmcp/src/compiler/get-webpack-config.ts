import { Compiler, Configuration, DefinePlugin, ProvidePlugin } from "webpack";
import path from "path";
import {
  outputPath,
  runtimeFolderPath,
  adapterOutputPath,
} from "../utils/constants";
import fs from "fs-extra";
import { builtinModules } from "module";
import { compilerContext } from "./compiler-context";
import {
  DEFAULT_HTTP_PORT,
  DEFAULT_HTTP_BODY_SIZE_LIMIT,
  DEFAULT_HTTP_ENDPOINT,
  DEFAULT_HTTP_STATELESS,
  XmcpParsedConfig,
} from "./parse-xmcp-config";

// Add this type for local use
type CorsConfig = {
  origin?: string | string[] | boolean;
  methods?: string | string[];
  allowedHeaders?: string | string[];
  exposedHeaders?: string | string[];
  credentials?: boolean;
  maxAge?: number;
};

export function getWebpackConfig(xmcpConfig: XmcpParsedConfig): Configuration {
  const processFolder = process.cwd();
  const { mode } = compilerContext.getContext();

  const selectedOutput = xmcpConfig.experimental?.adapter
    ? adapterOutputPath
    : outputPath;

  const fileName = xmcpConfig.experimental?.adapter ? "index.js" : "[name].js";

  const config: Configuration = {
    mode,
    watch: mode === "development",
    devtool: mode === "development" ? "eval-cheap-module-source-map" : false,
    output: {
      filename: fileName,
      path: selectedOutput,
      libraryTarget: "commonjs2",
    },
    target: "node",
    externals: [
      /**
       * Externalize Node.js built-in modules, bundle everything else
       */
      function (data, callback) {
        const { request } = data;

        if (!request) {
          return callback();
        }

        const isBuiltinModule =
          builtinModules.includes(request) ||
          builtinModules.includes(request.replace(/^node:/, ""));

        if (isBuiltinModule) {
          return callback(null, `commonjs ${request}`);
        }

        callback();
      },
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
    optimization: {
      minimize: mode === "production",
      splitChunks: false,
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

  if (xmcpConfig["http"]) {
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

    // inject oauth config
    definedVariables.OAUTH_CONFIG = JSON.stringify(
      xmcpConfig.experimental?.oauth || null
    );
  }

  // add entry points based on config
  config.entry = getEntries(xmcpConfig);

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

function getEntries(xmcpConfig: XmcpParsedConfig): Record<string, string> {
  const entries: Record<string, string> = {};
  if (xmcpConfig.stdio) {
    entries.stdio = path.join(runtimeFolderPath, "stdio.js");
  }
  if (xmcpConfig["http"]) {
    // non adapter mode
    if (!xmcpConfig.experimental?.adapter) {
      entries["http"] = path.join(runtimeFolderPath, "http.js");
    }

    // adapter mode enabled
    if (xmcpConfig.experimental?.adapter === "express") {
      entries["adapter"] = path.join(runtimeFolderPath, "adapter-express.js");
    }
    if (xmcpConfig.experimental?.adapter === "nextjs") {
      entries["adapter"] = path.join(runtimeFolderPath, "adapter-nextjs.js");
    }
  }
  return entries;
}
