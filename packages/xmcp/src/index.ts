import { webpack } from "webpack";
import { getWebpackConfig } from "./utils/get-webpack-config";
import chalk from "chalk";
import { getConfig, XmcpConfig } from "./utils/parse-config";
import chokidar from "chokidar";
import { generateImportCode } from "./utils/generate-import-code";
import fs from "fs";
import { runtimeFolderPath } from "./utils/constants";
import { createFolder } from "./utils/fs-utils";
import path from "path";
import { deleteSync } from "del";
import { type z } from "zod";

export type CompilerMode = "development" | "production";

export interface CompileOptions {
  mode: CompilerMode;
  configFilePath?: string;
}

export async function compile({
  mode,
  configFilePath = "xmcp.config.json",
}: CompileOptions) {
  const startTime = Date.now();
  let compilerStarted = false;

  const xmpcConfig = getConfig(configFilePath);
  let config = getWebpackConfig(mode, xmpcConfig);

  if (xmpcConfig.webpack) {
    config = xmpcConfig.webpack(config);
  }

  let pathList: string[] = [];
  const watcher = chokidar.watch("./src/tools/**/*.ts", {
    ignored: /(^|[\/\\])\../,
    persistent: mode === "development",
  });

  watcher
    .on("add", (path) => {
      pathList.push(path);
      if (compilerStarted) {
        generateCode(pathList);
      }
    })
    .on("unlink", (path) => {
      pathList = pathList.filter((p) => p !== path);
      if (compilerStarted) {
        generateCode(pathList);
      }
    })
    .on("ready", () => {
      let firstBuild = true;
      compilerStarted = true;

      // delete existing runtime folder
      deleteSync(runtimeFolderPath);
      createFolder(runtimeFolderPath);

      if (mode === "production") {
        watcher.close();
      }

      generateCode(pathList);

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

        if (firstBuild) {
          firstBuild = false;
          const endTime = Date.now();
          const duration = endTime - startTime;
          console.log(`Compiled in ${chalk.bold.green(`${duration}ms`)}`);
          onFirstBuild(mode, xmpcConfig);
        }
      });
    });
}

function generateCode(pathlist: string[]) {
  const fileContent = generateImportCode(pathlist);
  fs.writeFileSync(path.join(runtimeFolderPath, "import-map.js"), fileContent);
}

function onFirstBuild(mode: CompilerMode, xmcpConfig: XmcpConfig) {
  if (mode === "development") {
    console.log(chalk.bold.green("Starting inspector..."));
    const { spawn } = require("child_process");

    const inspectorArgs = ["@modelcontextprotocol/inspector@latest"];

    if (xmcpConfig.stdio) {
      inspectorArgs.push("node", "dist/stdio.js");
    }

    const inspector = spawn("npx", inspectorArgs, {
      stdio: "inherit",
      shell: true,
    });

    inspector.on("error", (err: Error) => {
      console.error("Failed to start inspector:", err);
    });
  }

  const builtResults = [];

  if (xmcpConfig.sse) {
    builtResults.push("- SSE server");
  }
  if (xmcpConfig.stdio) {
    builtResults.push("- STDIO server");
  }

  console.log(chalk.bold.green("Built:"));
  builtResults.forEach((result) => {
    console.log(chalk.bold(result));
  });
}

export type InferSchema<T extends Record<string, z.ZodType>> = {
  [K in keyof T]: z.infer<T[K]>;
};
