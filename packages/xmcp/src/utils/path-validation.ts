import { rootFolder } from "@/utils/constants";
import fs from "fs";
import path from "path";

// for further addition of resources, prompts, etc, we can add more path types
// used for the message error to the user
type PathType = "tools";

export function isValidPath(
  pathStr: string | undefined,
  type: PathType
): string | undefined {
  function isNonEmptyString(str: unknown): str is string {
    return typeof str === "string" && str.length > 0;
  }

  function isGlob(str: string): boolean {
    return /[*?\[\]{}]/.test(str);
  }

  function normalizePath(p: string): string {
    // normalize to posix (forward slashes)
    return p.split(/\\|\//).join("/");
  }

  function resolveAndCheckExists(p: string): string {
    const normalized = normalizePath(p);
    const absPath = path.resolve(rootFolder, normalized);
    if (!fs.existsSync(absPath)) {
      throw new Error(
        `The path set in xmcp config for ${type} does not exist: ${absPath}`
      );
    }

    return normalized; // still return the normalized path cause we're formatting to glob later
  }

  if (pathStr === undefined) {
    return undefined;
  }

  // reject empty string
  if (pathStr === "") {
    throw new Error(`${type} path cannot be an empty string`);
  }

  if (isNonEmptyString(pathStr)) {
    if (isGlob(pathStr)) {
      throw new Error(
        `If you are using a glob pattern, please use a string for the ${type} path`
      );
    }
    return resolveAndCheckExists(pathStr);
  }

  throw new Error(`${type} path must be a non-empty string`);
}
