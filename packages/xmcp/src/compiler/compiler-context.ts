import { CompilerMode } from ".";
import { createContext } from "../utils/context";
import { XmcpParsedConfig } from "./parse-xmcp-config";

interface CompilerContext {
  /** The mode of the compiler. */
  mode: CompilerMode;
  /** Whether the adapter is enabled. */
  adapter?: boolean;
  /** The platforms to build for. */
  platforms: {
    /** Generates a .vercel folder to deploy on Vercel */
    vercel?: boolean;
  };
  /** The paths to the tools. */
  toolPaths: Set<string>;
  /** Whether the middleware is enabled. */
  hasMiddleware: boolean;
  /** The parsed config. */
  xmcpConfig?: XmcpParsedConfig;
}

export const compilerContext = createContext<CompilerContext>({
  name: "xmcp-compiler",
});

// Preset some defaults for the compiler context
export const compilerContextProvider = (
  initialValue: Omit<CompilerContext, "toolPaths" | "hasMiddleware">,
  callback: () => void
) => {
  return compilerContext.provider(
    {
      ...initialValue,
      toolPaths: new Set(),
      hasMiddleware: false,
    },
    callback
  );
};

export const getXmcpConfig = () => {
  const { xmcpConfig } = compilerContext.getContext();
  if (!xmcpConfig) {
    throw new Error("xmcp config not found");
  }
  return xmcpConfig;
};
