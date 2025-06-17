import { JWTAuthMiddleware } from "xmcp";

export default JWTAuthMiddleware({
  secret: process.env.JWT_SECRET!,
  algorithms: ["HS256"],
});
