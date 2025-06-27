import { webpack } from "webpack";
import { getWebpackConfig } from "./utils/get-webpack-config";
import chalk from "chalk";
import { getConfig, XmcpConfig } from "./utils/parse-config";
import chokidar from "chokidar";
import { generateImportCode } from "./utils/generate-import-code";
import fs from "fs";
import { rootFolder, runtimeFolderPath } from "./utils/constants";
import { createFolder } from "./utils/fs-utils";
import path from "path";
import { deleteSync } from "del";
import { type z } from "zod";
import dotenv from "dotenv";
export { type Middleware } from "./types/middleware";
import { watchdog } from "./utils/spawn-process";
import { type ChildProcess, spawn } from "child_process";
import { generateEnvCode } from "./utils/generate-env-code";
dotenv.config();

let httpServerProcess: ChildProcess | null = null;

function spawnHttpServer() {
  const process = spawn("node", ["dist/streamable-http.js"], {
    stdio: "inherit",
    shell: true,
  });

  watchdog(process);

  return process;
}

async function killProcess(process: ChildProcess) {
  process.kill("SIGKILL");
  await new Promise((resolve) => {
    process.on("exit", resolve);
  });
}

async function startHttpServer() {
  if (!httpServerProcess) {
    console.log("Starting http server");
    // first time starting the server
    httpServerProcess = spawnHttpServer();
  } else {
    console.log("Restarting http server");
    // restart the server
    await killProcess(httpServerProcess);
    httpServerProcess = spawnHttpServer();
  }
}

export type CompilerMode = "development" | "production";

export interface CompileOptions {
  mode: CompilerMode;
  onBuild?: () => void;
  configFilePath?: string;
}

export function compile({
  mode,
  onBuild,
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
  // For now, we only support one middleware file
  let hasMiddleware = false;

  // Watcher for tools
  const toolsWatcher = chokidar.watch("./src/tools/**/*.ts", {
    ignored: /(^|[\/\\])\../,
    persistent: mode === "development",
    ignoreInitial: false,
  });

  // Watcher for middleware
  const middlewareWatcher = chokidar.watch("./src/middleware.ts", {
    ignored: /(^|[\/\\])\../,
    persistent: mode === "development",
    ignoreInitial: false,
  });

  toolsWatcher
    .on("add", (path) => {
      pathList.push(path);
      if (compilerStarted) {
        generateCode(pathList, hasMiddleware);
      }
    })
    .on("unlink", (path) => {
      pathList = pathList.filter((p) => p !== path);
      if (compilerStarted) {
        generateCode(pathList, hasMiddleware);
      }
    });

  middlewareWatcher
    .on("add", (path) => {
      hasMiddleware = true;
      if (compilerStarted) {
        generateCode(pathList, hasMiddleware);
      }
    })
    .on("unlink", (path) => {
      hasMiddleware = false;
      if (compilerStarted) {
        generateCode(pathList, hasMiddleware);
      }
    });

  // Wait for both watchers to be ready
  let toolsReady = false;
  let middlewareReady = false;

  toolsWatcher.on("ready", () => {
    toolsReady = true;
    checkBothReady();
  });

  middlewareWatcher.on("ready", () => {
    middlewareReady = true;
    checkBothReady();
  });

  function checkBothReady() {
    if (!toolsReady || !middlewareReady) {
      return;
    }

    let firstBuild = true;
    compilerStarted = true;

    // delete existing runtime folder
    deleteSync(runtimeFolderPath);
    createFolder(runtimeFolderPath);

    if (mode === "production") {
      toolsWatcher.close();
      middlewareWatcher.close();
    }

    generateCode(pathList, hasMiddleware);

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
        // user defined callback
        onBuild?.();
      } else {
        // on dev mode, webpack will recompile the code, so we need to start the http server after the first one
        if (mode === "development" && xmpcConfig["streamable-http"]) {
          startHttpServer();
        }
      }
    });
  }
}

function generateCode(pathlist: string[], hasMiddleware: boolean) {
  const fileContent = generateImportCode(pathlist, hasMiddleware);
  fs.writeFileSync(path.join(runtimeFolderPath, "import-map.js"), fileContent);

  // Generate runtime exports for global access
  const runtimeExportsCode = generateEnvCode();
  const envFilePath = path.join(rootFolder, "xmcp-env.d.ts");

  // Delete existing file if it exists
  if (fs.existsSync(envFilePath)) {
    fs.unlinkSync(envFilePath);
  }

  fs.writeFileSync(envFilePath, runtimeExportsCode);
}

function onFirstBuild(mode: CompilerMode, xmcpConfig: XmcpConfig) {
  if (mode === "development") {
    console.log(chalk.bold.green("Starting inspector..."));

    const inspectorArgs = ["@modelcontextprotocol/inspector@latest"];

    if (xmcpConfig.stdio) {
      inspectorArgs.push("node", "dist/stdio.js");
    }

    const inspector = watchdog(
      spawn("npx", inspectorArgs, {
        stdio: "inherit",
        shell: true,
      })
    );

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
  if (xmcpConfig["streamable-http"]) {
    builtResults.push("- Streamable HTTP server");
  }

  console.log(chalk.bold.green("Built:"));
  builtResults.forEach((result) => {
    console.log(chalk.bold(result));
  });
}
