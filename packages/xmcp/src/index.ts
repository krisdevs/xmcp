import { webpack } from "webpack"
import { getWebpackConfig } from "./utils/get-webpack-config"
import chalk from "chalk"

export type CompilerMode = "development" | "production"

export interface CompileOptions {
  mode: CompilerMode,
}


export async function compile({ mode }: CompileOptions) {
  const startTime = Date.now()
  const config = getWebpackConfig(mode)
  let firstBuild = true

  webpack(config, (err, stats) => {
    if (err) {
      console.error(err)
    }

    if (stats?.hasErrors()) {
      console.error(stats.toString({
        colors: true,
        chunks: false
      }))
      return
    }

    const endTime = Date.now()
    const duration = endTime - startTime
    console.log(`Compiled in ${chalk.bold.green(`${duration}ms`)}`)
    if (firstBuild) {
      firstBuild = false
      onFirstBuild(mode)
    }
  })
}

function onFirstBuild(mode: CompilerMode) {
  if (mode === 'development') {
    console.log(chalk.bold.green('Starting inspector...'))
    const { spawn } = require('child_process')
    const inspector = spawn('npx', ['@modelcontextprotocol/inspector@latest', 'node', 'dist/stdio.js'], {
      stdio: 'inherit',
      shell: true
    })

    inspector.on('error', (err: Error) => {
      console.error('Failed to start inspector:', err)
    })
  }
}