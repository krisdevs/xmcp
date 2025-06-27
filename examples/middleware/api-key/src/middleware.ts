// import { ApiKeyAuthMiddleware } from "xmcp";

import { Middleware } from "xmcp";

// export default ApiKeyAuthMiddleware({
//   apiKey: process.env.API_KEY!,
//   headerName: "X-API-KEY",
// });

const middleware: Middleware = (req, res, next) => {
  next();
};

export default middleware;
