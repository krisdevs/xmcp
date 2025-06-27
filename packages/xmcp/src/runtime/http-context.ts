import { AsyncLocalStorage } from "async_hooks";
import { IncomingHttpHeaders } from "http";

const STORAGE_KEY = Symbol.for("http-context");

export interface HttpContext {
  id: string;
  headers: IncomingHttpHeaders;
}

(globalThis as any)[STORAGE_KEY] =
  (globalThis as any)[STORAGE_KEY] ?? new AsyncLocalStorage<HttpContext>();

export const httpContext = (globalThis as any)[
  STORAGE_KEY
] as AsyncLocalStorage<HttpContext>;

export const setHttpContext = <K extends keyof HttpContext>(
  key: K,
  value: HttpContext[K]
) => {
  const store = httpContext.getStore();
  if (!store) {
    throw new Error(
      "setHttpContext() can only be used within the http transport."
    );
  }

  store[key] = value;
};

export const getHttpContext = <K extends keyof HttpContext>(
  key: K
): HttpContext[K] => {
  const store = httpContext.getStore();
  if (!store) {
    throw new Error(
      "getHttpContext() can only be used within the http transport."
    );
  }

  return store[key];
};
