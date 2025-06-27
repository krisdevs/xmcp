import { getHttpContext, httpContext } from "./http-context";

export const headers = () => {
  const store = httpContext.getStore();
  if (!store) {
    throw new Error("headres() can only be used within the http transport.");
  }

  return getHttpContext("headers");
};
