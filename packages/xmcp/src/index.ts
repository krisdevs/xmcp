import { webpack } from "webpack"
import { getWebpackConfig } from "./utils/get-webpack-config"
import chalk from "chalk"
import { getConfig, XmcpConfig } from "./utils/parse-config"

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
      onFirstBuild(mode, xmpcConfig)
    }
  })
}

function onFirstBuild(mode: CompilerMode, xmcpConfig: XmcpConfig) {
  if (mode === 'development') {
    console.log(chalk.bold.green('Starting inspector...'))
    const { spawn } = require('child_process')

    const inspectorArgs = ['@modelcontextprotocol/inspector@latest']

    if (xmcpConfig.stdio) {
      inspectorArgs.push('node', 'dist/stdio.js')
    }

    const inspector = spawn('npx', inspectorArgs, {
      stdio: 'inherit',
      shell: true
    })

    inspector.on('error', (err: Error) => {
      console.error('Failed to start inspector:', err)
    })
  }

  const builtResults = []

  if (xmcpConfig.sse) {
    builtResults.push('- SSE server')
  }
  if (xmcpConfig.stdio) {
    builtResults.push('- STDIO server')
  }

  console.log(chalk.bold.green('Built:'))
  builtResults.forEach(result => {
    console.log(chalk.bold(result))
  })
}