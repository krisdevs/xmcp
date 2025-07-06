import { jwtAuthMiddleware } from "xmcp";

export default jwtAuthMiddleware({
  secret: process.env.JWT_SECRET!,
  algorithms: ["HS256"],
});
