// Based on https://gist.github.com/nerdyman/2f97b24ab826623bff9202750013f99e

import path, { resolve } from "path";
import { readFileSync } from "fs";

/**
 * Resolve tsconfig.json paths to Webpack aliases
 * @param  {string} tsconfigPath           - Path to tsconfig
 * @param  {string} webpackConfigBasePath  - Path from tsconfig to Webpack config to create absolute aliases
 * @return {object}                        - Webpack alias config
 */
export function resolveTsconfigPathsToAlias({
  tsconfigPath = "./tsconfig.json",
} = {}) {
  const tsconfigContent = readFileSync(tsconfigPath, "utf-8");
  const { paths } = JSON.parse(tsconfigContent).compilerOptions;

  const aliases: Record<string, string> = {};

  Object.keys(paths).forEach((item) => {
    const key = item.replace("/*", "");
    const value = path.resolve(
      paths[item][0].replace("/*", "").replace("*", "")
    );

    aliases[key] = value;
  });

  return aliases;
}
