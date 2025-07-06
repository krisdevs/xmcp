#!/usr/bin/env node

// This is just a loader file to run the actual CLI from either dist/ or src/
// depending on whether we're in development or production mode

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Run the CLI
if (fs.existsSync(path.join(__dirname, "dist/index.js"))) {
  // Production mode - load from dist
  import("./dist/index.js");
} else {
  // Development mode - use ts-node to run from src
  import("ts-node").then((tsNode) => {
    tsNode.register({ project: path.join(__dirname, "tsconfig.json") });
    import("./src/index.js");
  });
}
