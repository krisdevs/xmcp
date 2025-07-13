// TODO create a shaded utility to type injected variables shaded between the runtime and the xmcp compiler

import {
  DEFAULT_HTTP_BODY_SIZE_LIMIT,
  DEFAULT_HTTP_ENDPOINT,
  DEFAULT_HTTP_PORT,
  DEFAULT_HTTP_STATELESS,
  XmcpParsedConfig,
} from "@/compiler/parse-xmcp-config";
import { compilerContext } from "../compiler-context";

// Add this type for local use
type CorsConfig = {
  origin?: string | string[] | boolean;
  methods?: string | string[];
  allowedHeaders?: string | string[];
  exposedHeaders?: string | string[];
  credentials?: boolean;
  maxAge?: number;
};

/**
 * The XMCP runtime uses variables that are not defined by default.
 *
 * This utility will define those variables based on the user's config.
 */
export function getInjectedVariables(xmcpConfig: XmcpParsedConfig) {
  const { mode } = compilerContext.getContext();

  const definedVariables: Record<string, string | number | boolean> = {};

  if (xmcpConfig["http"]) {
    // define variables
    definedVariables.HTTP_DEBUG = mode === "development";
    let cors: CorsConfig = {};
    if (typeof xmcpConfig["http"] === "object") {
      definedVariables.HTTP_PORT = xmcpConfig["http"].port;
      definedVariables.HTTP_BODY_SIZE_LIMIT = JSON.stringify(
        xmcpConfig["http"].bodySizeLimit
      );
      definedVariables.HTTP_ENDPOINT = JSON.stringify(
        xmcpConfig["http"].endpoint
      );
      definedVariables.HTTP_STATELESS = DEFAULT_HTTP_STATELESS;
      definedVariables.HTTP_HOST = JSON.stringify(xmcpConfig["http"].host || "");
      cors = xmcpConfig["http"].cors || {};
    } else {
      // http config is boolean
      definedVariables.HTTP_PORT = DEFAULT_HTTP_PORT;
      definedVariables.HTTP_BODY_SIZE_LIMIT = JSON.stringify(
        DEFAULT_HTTP_BODY_SIZE_LIMIT
      );
      definedVariables.HTTP_ENDPOINT = JSON.stringify(DEFAULT_HTTP_ENDPOINT);
      definedVariables.HTTP_STATELESS = DEFAULT_HTTP_STATELESS;
      definedVariables.HTTP_HOST = JSON.stringify("");
      cors = {};
    }
    // inject cors
    definedVariables.HTTP_CORS_ORIGIN = JSON.stringify(cors.origin ?? "");
    definedVariables.HTTP_CORS_METHODS = JSON.stringify(cors.methods ?? "");
    definedVariables.HTTP_CORS_ALLOWED_HEADERS = JSON.stringify(
      cors.allowedHeaders ?? ""
    );
    definedVariables.HTTP_CORS_EXPOSED_HEADERS = JSON.stringify(
      cors.exposedHeaders ?? ""
    );
    definedVariables.HTTP_CORS_CREDENTIALS =
      typeof cors.credentials === "boolean" ? cors.credentials : false;
    definedVariables.HTTP_CORS_MAX_AGE =
      typeof cors.maxAge === "number" ? cors.maxAge : 0;

    // inject oauth config
    definedVariables.OAUTH_CONFIG = JSON.stringify(
      xmcpConfig.experimental?.oauth || null
    );
  }

  definedVariables.TOOLS_PATH = JSON.stringify(xmcpConfig.paths?.tools);

  return definedVariables;
}
