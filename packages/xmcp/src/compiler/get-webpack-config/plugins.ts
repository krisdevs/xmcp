import { adapterOutputPath, runtimeFolderPath } from "@/utils/constants";
import fs from "fs-extra";
import path from "path";
import { Compiler } from "webpack";
import { getXmcpConfig } from "../compiler-context";

// @ts-expect-error: injected by compiler
export const runtimeFiles = RUNTIME_FILES as Record<string, string>;

export class InjectRuntimePlugin {
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

export class CreateTypeDefinitionPlugin {
  apply(compiler: Compiler) {
    let hasRun = false;
    compiler.hooks.afterEmit.tap(
      "CreateTypeDefinitionPlugin",
      (_compilationParams) => {
        if (hasRun) return;
        hasRun = true;

        const xmcpConfig = getXmcpConfig();

        if (xmcpConfig.experimental?.adapter) {
          let typeDefinitionContent = "";
          if (xmcpConfig.experimental?.adapter == "nextjs") {
            typeDefinitionContent = `export const xmcpHandler: (req: Request) => Promise<void>;
  `;
          } else if (xmcpConfig.experimental?.adapter == "express") {
            typeDefinitionContent = `import { Request, Response } from "express";
export const xmcpHandler: (req: Request, res: Response) => Promise<void>;
  `;
          }
          fs.writeFileSync(
            path.join(adapterOutputPath, "index.d.ts"),
            typeDefinitionContent
          );
        }
      }
    );
  }
}
