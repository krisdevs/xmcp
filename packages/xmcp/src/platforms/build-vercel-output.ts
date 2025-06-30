import path from "path";
import fs from "fs";

const rootDir = process.cwd();

async function buildVercelOutput() {
  const outputDir = path.join(rootDir, ".vercel", "output");
  const functionsDir = path.join(outputDir, "functions", "api", "index.func");

  console.log("🚀 Building Vercel output structure...");

  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(functionsDir, { recursive: true });

  const distDir = path.join(rootDir, "dist");
  const sourceFile = path.join(distDir, "http.js");
  const targetFile = path.join(functionsDir, "index.js");

  if (!fs.existsSync(distDir)) {
    throw new Error("❌ Dist directory not found. Run build first.");
  }

  if (fs.existsSync(sourceFile)) {
    fs.copyFileSync(sourceFile, targetFile);
  } else {
    throw new Error(
      "❌ Application server file not found in dist/. Run build first."
    );
  }

  // copy all other files from dist directory that http.js might depend on
  const distContents = fs.readdirSync(distDir);

  // to do add proper error handling for failed copy
  for (const item of distContents) {
    const sourcePath = path.join(distDir, item);
    const targetPath = path.join(functionsDir, item);

    if (item === "http.js" || item === "stdio.js") continue;

    const stat = fs.statSync(sourcePath);
    if (stat.isFile()) {
      fs.copyFileSync(sourcePath, targetPath);
    } else if (stat.isDirectory()) {
      fs.cpSync(sourcePath, targetPath, { recursive: true });
    }
  }

  const packageJsonSource = path.join(rootDir, "package.json");
  const packageJsonTarget = path.join(functionsDir, "package.json");
  fs.copyFileSync(packageJsonSource, packageJsonTarget);

  console.log("Server and dependency files copied to function directory");

  const vcConfig = {
    handler: "index.js",
    runtime: "nodejs22.x",
    launcherType: "Nodejs",
    shouldAddHelpers: true,
  };

  fs.writeFileSync(
    path.join(functionsDir, ".vc-config.json"),
    JSON.stringify(vcConfig, null, 2)
  );

  const config = {
    version: 3,
    routes: [
      {
        src: "^/(.*)$",
        dest: "/api",
      },
      {
        handle: "filesystem",
      },
    ],
  };

  fs.writeFileSync(
    path.join(outputDir, "config.json"),
    JSON.stringify(config, null, 2)
  );

  console.log("✅ Vercel output structure created successfully");
}

export { buildVercelOutput };
