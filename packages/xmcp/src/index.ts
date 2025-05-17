import { getWebpackConfig } from "./utils/get-webpack-config"

export interface CompileOptions {
  mode: "development" | "production",
}

export async function compile({ mode }: CompileOptions) {
  const config = getWebpackConfig(mode)
}