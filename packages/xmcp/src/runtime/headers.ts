import { getHttpContext, httpContext } from "./http-context";

export const headers = () => {
  const store = httpContext.getStore();
  if (!store) {
    throw new Error("headres() can only be used within the http transport.");
  }

  const headers = getHttpContext("headers");

  if (!headers) {
    throw new Error(
      "Error: headers not initialized. This is probably a bug. Please report it."
    );
  }

  return headers;
};
