import { IncomingHttpHeaders } from "http";
import { createContext } from "../../utils/context";

export interface HttpContext {
  id: string;
  headers: IncomingHttpHeaders;
}

export const httpContext = createContext<HttpContext>({ name: "http-context" });

export const setHttpContext = httpContext.setContext;

export const getHttpContext = httpContext.getContext;

export const httpContextProvider = httpContext.provider;
