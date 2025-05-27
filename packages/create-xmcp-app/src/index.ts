#!/usr/bin/env node

import path from "path";
import fs from "fs-extra";
import chalk from "chalk";
import { Command } from "commander";
import inquirer from "inquirer";
import ora from "ora";
import { fileURLToPath } from "url";
import { createProject } from "./createProject.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../package.json"), "utf8")
);

const program = new Command();

program
  .name("create-xmcp-app")
  .version(packageJson.version)
  .description("Create a new XMCP application")
  .argument("[project-directory]", "Directory to create the app in")
  .option("-y, --yes", "Skip confirmation prompt", false)
  .option("--use-npm", "Use npm as package manager (default: use npm)")
  .option("--use-yarn", "Use yarn as package manager")
  .option("--use-pnpm", "Use pnpm as package manager")
  .option("--local", "Use local xmcp package (for development)", false)
  .action(async (projectDir, options) => {
    console.log(chalk.bold(`\ncreate-xmcp-app v${packageJson.version}!`));

    // If project directory wasn't specified, ask for it
    if (!projectDir) {
      const answers = await inquirer.prompt([
        {
          type: "input",
          name: "projectDir",
          message: "What is your project named?",
          default: "my-xmcp-app",
        },
      ]);
      projectDir = answers.projectDir;
    }

    // Normalize project directory
    const resolvedProjectPath = path.resolve(process.cwd(), projectDir);
    const projectName = path.basename(resolvedProjectPath);

    // Check if directory exists
    if (fs.existsSync(resolvedProjectPath)) {
      const stats = fs.statSync(resolvedProjectPath);
      if (!stats.isDirectory()) {
        console.error(
          chalk.red(`Error: ${projectName} exists but is not a directory.`)
        );
        process.exit(1);
      }

      // Check if directory is empty
      const files = fs.readdirSync(resolvedProjectPath);
      if (files.length > 0) {
        if (!options.yes) {
          const { proceed } = await inquirer.prompt([
            {
              type: "confirm",
              name: "proceed",
              message: `The directory ${chalk.cyan(projectName)} is not empty. Continue anyway?`,
              default: false,
            },
          ]);
          if (!proceed) {
            console.log(chalk.yellow("Aborting installation."));
            process.exit(0);
          }
        }
      }
    }

    let packageManager = "npm";
    let useLocalXmcp = options.local;

    if (!options.yes) {
      if (options.useYarn) packageManager = "yarn";
      if (options.usePnpm) packageManager = "pnpm";

      if (!options.useYarn && !options.usePnpm && !options.useNpm) {
        const pmAnswers = await inquirer.prompt([
          {
            type: "list",
            name: "packageManager",
            message: "Select a package manager:",
            choices: [
              { name: "npm", value: "npm" },
              { name: "yarn", value: "yarn" },
              { name: "pnpm", value: "pnpm" },
            ],
            default: "npm",
          },
        ]);
        packageManager = pmAnswers.packageManager;
      }

      // Prompt for local flag if not specified via command-line
      const localAnswers = await inquirer.prompt([
        {
          type: "list",
          name: "useLocalXmcp",
          message: "Use local xmcp package (for development)?",
          choices: [
            { name: "Yes", value: true },
            { name: "No", value: false },
          ],
          default: true,
        },
      ]);
      useLocalXmcp = localAnswers.useLocalXmcp;

      console.log();
      console.log(
        `Creating a new XMCP app in ${chalk.green(resolvedProjectPath)}.`
      );
      console.log();
      console.log("Options:");
      console.log(`  - ${chalk.cyan("Package Manager")}: ${packageManager}`);
      console.log(`  - ${chalk.cyan("Language")}: TypeScript`);
      console.log(
        `  - ${chalk.cyan("Use Local XMCP")}: ${useLocalXmcp ? "Yes" : "No"}`
      );
      console.log();

      const { confirmed } = await inquirer.prompt([
        {
          type: "confirm",
          name: "confirmed",
          message: "Ok to continue?",
          default: true,
        },
      ]);

      if (!confirmed) {
        console.log(chalk.yellow("Aborting installation."));
        process.exit(0);
      }
    } else {
      // Use command-line options when --yes is provided
      if (options.useYarn) packageManager = "yarn";
      if (options.usePnpm) packageManager = "pnpm";
    }

    const spinner = ora("Creating your XMCP app...").start();
    try {
      await createProject({
        projectPath: resolvedProjectPath,
        projectName,
        packageManager,
        useLocalXmcp,
      });

      spinner.succeed(chalk.green("Your XMCP app is ready!"));

      console.log();
      console.log("Next steps:");
      console.log(`  cd ${chalk.cyan(projectDir)}`);

      if (packageManager === "yarn") {
        console.log(`  ${chalk.cyan("yarn dev")}`);
      } else if (packageManager === "pnpm") {
        console.log(`  ${chalk.cyan("pnpm dev")}`);
      } else {
        console.log(`  ${chalk.cyan("npm run dev")}`);
      }

      console.log();
      console.log("To learn more about XMCP:");
      console.log(
        "  - Read the documentation at https://github.com/basementstudio/xmcp"
      );
      console.log();
      console.log(`From the ${chalk.bgBlack.white("basement.")}`);
      console.log();
    } catch (error) {
      spinner.fail(chalk.red("Failed to create the project."));
      console.error(error);
      process.exit(1);
    }
  });

program.parse(process.argv);
