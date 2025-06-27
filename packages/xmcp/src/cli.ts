#!/usr/bin/env node
import { Command } from "commander";
import { compile } from "./compile";
import { buildVercelOutput } from "./platforms/build-vercel-output";
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
  .option("--vercel", "Build for Vercel deployment")
  .action(async (options) => {
    console.log(`${xmcpLogo} Building for production...`);
    compile({
      mode: "production",
      onBuild: async () => {
        if (options.vercel) {
          console.log(`${xmcpLogo} Building for Vercel...`);
          try {
            await buildVercelOutput();
          } catch (error) {
            console.error(
              chalk.red("❌ Failed to create Vercel output structure:"),
              error
            );
          }
        }
      },
    });
  });

program.parse();
