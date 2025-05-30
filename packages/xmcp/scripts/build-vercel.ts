#!/usr/bin/env tsx

import { buildVercelOutput } from "../compiler/build-vercel-output";

export async function buildVercel() {
  try {
    console.log("📦 Building Vercel output structure only...");
    console.log(
      "💡 Note: This assumes webpack compilation has already been run."
    );
    console.log("💡 If you need to compile first, use: pnpm build");
    console.log("");

    await buildVercelOutput();
    process.exit(0);
  } catch (error) {
    console.error("❌ Build failed:", error);
    console.error("");
    console.error(
      '�� If you see "Source sse.js file not found", run "pnpm build" first.'
    );
    process.exit(1);
  }
}
