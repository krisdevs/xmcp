import { webpack } from "webpack";
import { getWebpackConfig } from "./get-webpack-config";
import chalk from "chalk";
import { getConfig } from "./parse-xmcp-config";
import chokidar from "chokidar";
import { generateImportCode } from "./generate-import-code";
import fs from "fs";
import { rootFolder, runtimeFolderPath } from "@/utils/constants";
import { createFolder } from "@/utils/fs-utils";
import path from "path";
import { deleteSync } from "del";
import dotenv from "dotenv";
export { type Middleware } from "@/types/middleware";
import { watchdog } from "@/utils/spawn-process";
import { type ChildProcess, spawn } from "child_process";
import { generateEnvCode } from "./generate-env-code";
import { Watcher } from "@/utils/file-watcher";
import { onFirstBuild } from "./on-first-build";
import { greenCheck, yellowArrow } from "@/utils/cli-icons";
import { compilerContext } from "./compiler-context";
dotenv.config();

let httpServerProcess: ChildProcess | null = null;

function spawnHttpServer() {
  const process = spawn("node", ["dist/http.js"], {
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
    console.log(`${yellowArrow} Starting http server`);
    // first time starting the server
    httpServerProcess = spawnHttpServer();
  } else {
    console.log(`${yellowArrow} Restarting http server`);
    // restart the server
    await killProcess(httpServerProcess);
    httpServerProcess = spawnHttpServer();
  }
}

export type CompilerMode = "development" | "production";

export interface CompileOptions {
  onBuild?: () => void;
}

export async function compile({ onBuild }: CompileOptions = {}) {
  const { mode, toolPaths } = compilerContext.getContext();
  const startTime = Date.now();
  let compilerStarted = false;

  const xmpcConfig = await getConfig();
  let config = getWebpackConfig(xmpcConfig);

  if (xmpcConfig.webpack) {
    config = xmpcConfig.webpack(config);
  }

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

  const watcher = new Watcher();

  // TODO add hability to customize tools path
  // handle tools
  watcher.watch("./src/tools/**/*.ts", {
    onAdd: (path) => {
      toolPaths.add(path);
      if (compilerStarted) {
        generateCode();
      }
    },
    onUnlink: (path) => {
      toolPaths.delete(path);
      if (compilerStarted) {
        generateCode();
      }
    },
  });

  // if adapter is not enabled, handle middleware
  if (!xmpcConfig.experimental?.adapter) {
    // handle middleware
    watcher.watch("./src/middleware.ts", {
      onAdd: () => {
        compilerContext.setContext({
          ...compilerContext.getContext(),
          hasMiddleware: true,
        });
        if (compilerStarted) {
          generateCode();
        }
      },
      onUnlink: () => {
        compilerContext.setContext({
          hasMiddleware: false,
        });
        if (compilerStarted) {
          generateCode();
        }
      },
    });
  }

  // start compiler
  watcher.onReady(() => {
    let firstBuild = true;
    compilerStarted = true;

    // delete existing runtime folder
    deleteSync(runtimeFolderPath);
    createFolder(runtimeFolderPath);

    if (mode === "production") {
      toolsWatcher.close();
      middlewareWatcher.close();
    }

    generateCode();

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
        console.log(
          `${greenCheck} Compiled in ${chalk.bold.green(`${duration}ms`)}`
        );
        onFirstBuild(mode, xmpcConfig);
        // user defined callback
        onBuild?.();
      } else {
        // on dev mode, webpack will recompile the code, so we need to start the http server after the first one
        if (mode === "development" && xmpcConfig["http"]) {
          startHttpServer();
        }
      }
    });
  });
}

function generateCode() {
  const fileContent = generateImportCode();
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
