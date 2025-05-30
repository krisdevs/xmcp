import path from "path";
import fs from "fs";
import { execSync } from "child_process";

const rootDir = process.cwd();

function detectPackageManager(): {
  manager: string;
  lockFile: string;
  installCmd: string;
} {
  const pnpmLock = path.join(rootDir, "pnpm-lock.yaml");
  const npmLock = path.join(rootDir, "package-lock.json");
  const yarnLock = path.join(rootDir, "yarn.lock");

  if (fs.existsSync(pnpmLock)) {
    return {
      manager: "pnpm",
      lockFile: "pnpm-lock.yaml",
      installCmd: "pnpm install --prod",
    };
  } else if (fs.existsSync(npmLock)) {
    return {
      manager: "npm",
      lockFile: "package-lock.json",
      installCmd: "npm ci --omit=dev",
    };
  } else if (fs.existsSync(yarnLock)) {
    return {
      manager: "yarn",
      lockFile: "yarn.lock",
      installCmd: "yarn install --production --frozen-lockfile",
    };
  } else {
    return {
      manager: "npm",
      lockFile: "",
      installCmd: "npm install --omit=dev",
    };
  }
}

async function buildVercelOutput() {
  const outputDir = path.join(rootDir, ".vercel", "output");
  const functionsDir = path.join(outputDir, "functions", "index.func");
  const packageManager = detectPackageManager();

  console.log("🚀 Building Vercel output structure...");
  console.log(`📦 Detected package manager: ${packageManager.manager}`);

  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(functionsDir, { recursive: true });

  const sourceFile = path.join(rootDir, "dist", "sse.js");
  const targetFile = path.join(functionsDir, "index.js");

  if (fs.existsSync(sourceFile)) {
    fs.copyFileSync(sourceFile, targetFile);
    console.log("✅ Copied sse.js to function directory as index.js");
  } else {
    throw new Error(
      "❌ Source sse.js file not found in dist/. Run build first."
    );
  }

  const packageJsonSource = path.join(rootDir, "package.json");
  const packageJsonTarget = path.join(functionsDir, "package.json");
  fs.copyFileSync(packageJsonSource, packageJsonTarget);
  console.log("✅ Copied package.json to function directory");

  if (packageManager.lockFile) {
    const lockFileSource = path.join(rootDir, packageManager.lockFile);
    const lockFileTarget = path.join(functionsDir, packageManager.lockFile);
    if (fs.existsSync(lockFileSource)) {
      fs.copyFileSync(lockFileSource, lockFileTarget);
      console.log(`✅ Copied ${packageManager.lockFile} to function directory`);
    }
  }

  console.log("📦 Installing production dependencies...");
  try {
    execSync(packageManager.installCmd, {
      cwd: functionsDir,
      stdio: "inherit",
    });
  } catch (error) {
    console.error("❌ Failed to install dependencies:", error);
    throw error;
  }

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
  console.log("✅ Created .vc-config.json");

  const config = {
    version: 3,
    routes: [
      {
        src: "^/(.*)$",
        dest: "/index.js",
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
  console.log("✅ Created config.json");

  console.log("🎉 Vercel output structure created successfully!");
  console.log(`📁 Output directory: ${outputDir}`);
}

export { buildVercelOutput };
