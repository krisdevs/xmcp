import { webpack } from "webpack";
import { getWebpackConfig } from "./utils/get-webpack-config";
import chalk from "chalk";
import { getConfig, XmcpInputConfig } from "./utils/parse-config";
import chokidar from "chokidar";
import { generateImportCode } from "./utils/generate-import-code";
import fs from "fs";
import { rootFolder, runtimeFolderPath } from "./utils/constants";
import { createFolder } from "./utils/fs-utils";
import path from "path";
import { deleteSync } from "del";
import dotenv from "dotenv";
export { type Middleware } from "./types/middleware";
import { watchdog } from "./utils/spawn-process";
import { type ChildProcess, spawn } from "child_process";
import { generateEnvCode } from "./utils/generate-env-code";
import { createContext } from "./utils/context";
dotenv.config();

interface CompilerContext {
  mode: CompilerMode;
  platforms: {
    vercel?: boolean;
  };
}

export const compilerContext = createContext<CompilerContext>({
  name: "xmcp-compiler",
});

let httpServerProcess: ChildProcess | null = null;

const greenCheck = chalk.bold.green("✔");

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

const yellowArrow = chalk.bold.yellow("❯");

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
  const { mode } = compilerContext.getContext();
  const startTime = Date.now();
  let compilerStarted = false;

  const xmpcConfig = await getConfig();
  let config = getWebpackConfig(xmpcConfig);

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

function onFirstBuild(mode: CompilerMode, xmcpConfig: XmcpInputConfig) {
  if (mode === "development") {
    console.log("🔍 Starting inspector...");

    const inspectorArgs = ["@modelcontextprotocol/inspector@latest"];

    if (xmcpConfig.stdio) {
      inspectorArgs.push("node", "dist/stdio.js");
    }

    const inspectorProcess = spawn("npx", inspectorArgs, {
      stdio: ["inherit", "pipe", "pipe"],
      shell: true,
    });

    watchdog(inspectorProcess);

    // Prefix inspector output with [Inspector]
    inspectorProcess.stdout?.on("data", (data: Buffer) => {
      const lines = data.toString().split("\n");
      lines.forEach((line) => {
        if (line.trim()) {
          if (line.includes("?MCP_PROXY_AUTH_TOKEN")) {
            console.log(`🔍 Inspector started at ${line}`);
          }
        }
      });
    });

    inspectorProcess.stderr?.on("data", (data: Buffer) => {
      const lines = data.toString().split("\n");
      lines.forEach((line) => {
        if (line.trim()) {
          console.error(`[Inspector] ${line}`);
        }
      });
    });

    inspectorProcess.on("error", (err: Error) => {
      console.error("[Inspector] Failed to start inspector:", err);
    });
  }

  const builtResults = [];

  if (xmcpConfig.stdio) {
    builtResults.push(`${greenCheck} Built STDIO server`);
  }
  if (xmcpConfig["http"]) {
    builtResults.push(`${greenCheck} Built HTTP server`);
  }

  builtResults.forEach((result) => {
    console.log(result);
  });
}
