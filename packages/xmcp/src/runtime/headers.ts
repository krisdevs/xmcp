import { type Request } from "express";
import { IncomingHttpHeaders } from "http";

interface Headers {
  initialized: boolean;
  headers: IncomingHttpHeaders;
}

const headersData: Headers = {
  initialized: false,
  headers: {},
};

export const setHeaders = (request: Request) => {
  headersData.initialized = true;

  headersData.headers = request.headers;
};

export const headers = () => {
  if (!headersData.initialized) {
    throw new Error(
      "Headers not initialized, headres() can only be used within the http transport."
    );
  }

  return headersData.headers;
};
