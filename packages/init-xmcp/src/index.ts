#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import inquirer from "inquirer";
import { init } from "./helpers/init.js";
import { detectFramework } from "./helpers/detect-framework.js";
import { detectPackageManager } from "./helpers/install.js";
import fs from "fs-extra";
import path from "path";
import { checkNodeVersion } from "./utils/check-node.js";
import { fileURLToPath } from "url";

checkNodeVersion();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../package.json"), "utf8")
);

const program = new Command()
  .name("init-xmcp")
  .description("Initialize xmcp in an existing project")
  .version(
    packageJson.version,
    "-v, --version",
    "Output the current version of init-xmcp."
  )
  .helpOption("-h, --help", "Display help message.")
  .option("-y, --yes", "Skip confirmation prompts", false)
  .option(
    "--package-manager <manager>",
    "Specify package manager (npm, yarn, pnpm)",
    ""
  )
  .option("--tools-path <path>", "Specify custom tools path", "")
  .action(async (options) => {
    console.log(chalk.bold(`\ninit-xmcp@${packageJson.version}`));

    const projectRoot = process.cwd();

    // check if it's a node js project
    if (!fs.existsSync(path.join(projectRoot, "package.json"))) {
      console.error(
        chalk.red(
          "Error: No package.json found. Please run this command in a Node.js project."
        )
      );
      process.exit(1);
    }

    // check if xmcp is already initialized
    if (
      fs.existsSync(path.join(projectRoot, "xmcp.config.ts")) ||
      fs.existsSync(path.join(projectRoot, "xmcp.config.json"))
    ) {
      console.error(
        chalk.red("Error: xmcp is already initialized in this project.")
      );
      process.exit(1);
    }

    // detect framework and package manager
    const detectedFramework = detectFramework(projectRoot);
    const detectedPackageManager = detectPackageManager(projectRoot);

    // determine tools path
    let toolsPath: string;
    if (options.toolsPath) {
      toolsPath = options.toolsPath;
    } else {
      // check if src folder exists and default to src/tools if it does, otherwise tools
      const hasSrcFolder = fs.existsSync(path.join(projectRoot, "src"));
      toolsPath = hasSrcFolder ? "src/tools" : "tools";
    }

    // determine package manager
    let packageManager: "npm" | "yarn" | "pnpm";
    if (detectedPackageManager) {
      packageManager = detectedPackageManager;
    } else if (options.packageManager) {
      packageManager = options.packageManager as "npm" | "yarn" | "pnpm";
    } else {
      // no package manager detected, will prompt user
      packageManager = "npm"; // default fallback
    }

    // interactive prompts if not --yes
    if (!options.yes) {
      console.log(chalk.blue("\n📋 xmcp Initialization Settings:"));
      console.log(`   Framework: ${chalk.cyan(detectedFramework)}`);

      const prompts = [];
      prompts.push({
        type: "input",
        name: "toolsPath",
        message: "Tools directory path:",
        default: toolsPath,
      });
      if (!detectedPackageManager) {
        prompts.push({
          type: "list",
          name: "packageManager",
          message: "Package manager:",
          choices: [
            { name: "npm", value: "npm" },
            { name: "yarn", value: "yarn" },
            { name: "pnpm", value: "pnpm" },
          ],
          default: packageManager,
        });
      } else {
        console.log(
          chalk.green(`   Package manager detected: ${packageManager}`)
        );
      }
      prompts.push({
        type: "confirm",
        name: "confirmed",
        message: "Continue with initialization?",
        default: true,
      });

      const answers = await inquirer.prompt(prompts);

      if (!answers.confirmed) {
        console.log(chalk.yellow("❌ Aborting initialization."));
        process.exit(0);
      }

      toolsPath = answers.toolsPath;
      if (!detectedPackageManager) {
        packageManager = answers.packageManager;
      }
    }

    // Check if tools directory already exists and has content
    const toolsDirPath = path.join(projectRoot, toolsPath);
    if (fs.existsSync(toolsDirPath)) {
      const toolsDirContent = fs.readdirSync(toolsDirPath);
      if (toolsDirContent.length > 0) {
        console.warn(
          chalk.yellow(
            `Warning: Tools directory "${toolsPath}" already exists and is not empty.`
          )
        );

        if (!options.yes) {
          const { overwrite } = await inquirer.prompt([
            {
              type: "confirm",
              name: "overwrite",
              message:
                "Do you want to continue? Existing files will be preserved.",
              default: true,
            },
          ]);

          if (!overwrite) {
            console.log(chalk.yellow("❌ Aborting initialization."));
            process.exit(0);
          }
        }
      }
    }

    try {
      console.log(chalk.blue("\n Initializing xmcp..."));

      // Call the init function with our determined settings
      await init({
        projectRoot,
        framework: detectedFramework,
        toolsPath,
        packageManager,
      });

      console.log(chalk.green("\n✅ xmcp initialized successfully!"));
      console.log(chalk.blue("\n📁 Files created:"));
      console.log(`   • xmcp.config.ts`);
      console.log(`   • ${toolsPath}/greet.ts`);
      console.log(chalk.blue("\n📁 Files updated:"));
      console.log(`   • package.json scripts`);

      console.log(chalk.blue("\nNext steps:"));
      console.log(
        `   Run "${packageManager} run dev" to start the development server`
      );
    } catch (error) {
      console.error(chalk.red("\nFailed to initialize xmcp:"));
      console.error(error);
      process.exit(1);
    }
  });

program.parse();
