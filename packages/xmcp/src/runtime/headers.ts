import { getHttpContext } from "./transports/http/http-context";

export const headers = () => {
  const headers = getHttpContext().headers;

  if (!headers) {
    throw new Error(
      "Error: headers not initialized. This is probably a bug. Please report it."
    );
  }

  return headers;
};
