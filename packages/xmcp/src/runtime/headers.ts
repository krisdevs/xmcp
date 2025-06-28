import { getHttpContext } from "./transports/http/http-context";

export const headers = () => {
  const headers = getHttpContext().headers;

  return headers;
};
