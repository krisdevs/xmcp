#!/usr/bin/env node
import { Command } from "commander";
import { compile } from "./index";
import { buildVercelOutput } from "../compiler/build-vercel-output";
import chalk from "chalk";

const program = new Command();

const xmcpLogo = chalk.bold.bgBlue(" XMCP ");

program.name("xmcp").description("The MCP framework CLI").version("0.0.1");

program
  .command("dev")
  .description("Start development mode")
  .action(() => {
    console.log(`${xmcpLogo} Starting development mode...`);
    compile({ mode: "development" });
  });

program
  .command("build")
  .description("Build for production")
  .action(() => {
    console.log(`${xmcpLogo} Building for production...`);
    compile({ mode: "production" });
  });

program
  .command("build:vercel")
  .description("Build for Vercel")
  .action(async () => {
    console.log(`${xmcpLogo} Building for Vercel...`);
    await compile({ mode: "production" });

    console.log(`${xmcpLogo} Creating Vercel output structure...`);
    try {
      await buildVercelOutput();
    } catch (error) {
      console.error(
        chalk.red("❌ Failed to create Vercel output structure:"),
        error
      );
      process.exit(1);
    }
  });

program.parse();
