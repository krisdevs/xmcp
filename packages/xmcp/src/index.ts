import { webpack } from "webpack"
import { getWebpackConfig } from "./utils/get-webpack-config"
import chalk from "chalk"
import { getConfig } from "./utils/parse-config"

export type CompilerMode = "development" | "production"

export interface CompileOptions {
  mode: CompilerMode,
  configFilePath?: string
}


export async function compile({ mode, configFilePath = 'xmcp.config.json' }: CompileOptions) {
  const startTime = Date.now()

  const xmpcConfig = getConfig(configFilePath)
  let config = getWebpackConfig(mode, xmpcConfig)

  if (xmpcConfig.webpack) {
    config = xmpcConfig.webpack(config)
  }

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

    if (firstBuild) {
      firstBuild = false
      const endTime = Date.now()
      const duration = endTime - startTime
      console.log(`Compiled in ${chalk.bold.green(`${duration}ms`)}`)
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