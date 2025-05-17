import { Configuration } from "webpack"
import path from "path"
import { runtimePath } from "./constants"

export function getWebpackConfig(mode: "development" | "production"): Configuration {
  return {
    mode,
    entry: path.join(runtimePath, "index.ts"),
  }
}