import fs from "fs-extra";
import path from "path";

export type Framework = "nextjs" | "express";

export function detectFramework(projectRoot: string): Framework {
  // check if project has been initialized with nextjs or default to express
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(projectRoot, "package.json"), "utf-8")
  );

  if (!packageJson.dependencies?.next && !packageJson.devDependencies?.next) {
    return "express";
  }

  return "nextjs";
}
