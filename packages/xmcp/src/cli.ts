#!/usr/bin/env node
import { Command } from "commander"
import { compile } from "./index"

const program = new Command()

program
  .name("xmcp")
  .description("The MCP framework CLI")
  .version("0.0.1")

program
  .command("dev")
  .description("Start development mode")
  .action(() => {
    console.log("Starting development mode...")
    compile({ mode: "development" })
  })

program
  .command("build")
  .description("Build for production")
  .action(() => {
    console.log("Building for production...")
    compile({ mode: "production" })
  })

program.parse()