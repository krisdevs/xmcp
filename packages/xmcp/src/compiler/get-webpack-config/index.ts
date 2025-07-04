import { Compiler, Configuration, DefinePlugin, ProvidePlugin } from "webpack";
import path from "path";
import {
  outputPath,
  runtimeFolderPath,
  adapterOutputPath,
} from "@/utils/constants";
import fs from "fs-extra";
import { builtinModules } from "module";
import { compilerContext } from "@/compiler/compiler-context";
import { XmcpParsedConfig } from "@/compiler/parse-xmcp-config";
import { getEntries } from "./get-entries";
import { getInjectedVariables } from "./get-injected-variables";
import { resolveTsconfigPathsToAlias } from "./resolve-tsconfig-paths";
import { CleanWebpackPlugin } from "clean-webpack-plugin";

// @ts-expect-error: injected by compiler
const runtimeFiles = RUNTIME_FILES as Record<string, string>;

/** Creates the webpack configuration that xmcp will use to bundle the user's code */
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

        // Check if request is inside .xmcp folder - if so, bundle it
        if (request.includes(".xmcp")) {
          return callback();
        }

        const filesToInclude = [...Object.keys(runtimeFiles), "import-map.js"];

        // Check if request is a runtime file - if so, bundle it
        for (const file of filesToInclude) {
          if (
            request.endsWith(`./${file}`) ||
            request.endsWith(`./${file.replace(".js", "")}`)
          ) {
            return callback();
          }
        }

        if (xmcpConfig.experimental?.adapter === "nextjs") {
          // When using nextjs, we want next to bundle the code for the tool file
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
        ...resolveTsconfigPathsToAlias(),
      },
      extensions: [".tsx", ".ts", ".jsx", ".js", ".json"],
    },
    plugins: [new InjectRuntimePlugin(), new CleanWebpackPlugin()],
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

  // add entry points based on config
  config.entry = getEntries(xmcpConfig);

  // add injected variables to config
  config.plugins!.push(new ProvidePlugin(providedPackages));

  // add defined variables to config
  const definedVariables = getInjectedVariables(xmcpConfig);
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

        for (const [fileName, fileContent] of Object.entries(runtimeFiles)) {
          fs.writeFileSync(path.join(runtimeFolderPath, fileName), fileContent);
        }
      }
    );
  }
}
