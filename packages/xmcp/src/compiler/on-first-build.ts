import { spawn } from "child_process";
import { CompilerMode } from ".";
import { XmcpInputConfig } from "./parse-xmcp-config";
import { watchdog } from "../utils/spawn-process";
import { greenCheck } from "../utils/cli-icons";

export function onFirstBuild(mode: CompilerMode, xmcpConfig: XmcpInputConfig) {
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
