import { webpack } from "webpack"
import { getWebpackConfig } from "./utils/get-webpack-config"

export interface CompileOptions {
  mode: "development" | "production",
}

export async function compile({ mode }: CompileOptions) {
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

    console.log(stats?.toString({
      colors: true,
      chunks: false
    }))
  })
}