import { webpack } from "webpack"
import { getWebpackConfig } from "./utils/get-webpack-config"
import chalk from "chalk"

export interface CompileOptions {
  mode: "development" | "production",
}

export async function compile({ mode }: CompileOptions) {
  const startTime = Date.now()
  const config = getWebpackConfig(mode)

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
  })
}