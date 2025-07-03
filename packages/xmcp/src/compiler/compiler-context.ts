import { CompilerMode } from ".";
import { createContext } from "../utils/context";

interface CompilerContext {
  mode: CompilerMode;
  adapter?: boolean;
  platforms: {
    vercel?: boolean;
  };
  toolPaths: Set<string>;
  hasMiddleware: boolean;
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
