import { type Middleware } from "xmcp";
import jwt from "jsonwebtoken";

const EXAMPLE_SECRET = "pepeabjsdasnjdjalhadsjlasdhjdasadhsjl";

const middleware: Middleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: "No authorization header" });
    return;
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    res.status(401).json({ error: "No token provided" });
    return;
  }

  try {
    const decoded = jwt.verify(token, EXAMPLE_SECRET);
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }
  next();
};

export default middleware;

// export default function middleware(req, res, next) => {
//   return(JWTMiddleware(config))
// };

// export default function middleware(req, res, next) => {
//   return(ApiKeyMiddleware(config))
// };

// export const jwt = async (token: string) => {
//   kv.get();
//   return jwt.verify(token, process.env.JWT_SECRET);
// };

// export const apiKey = (key: string) => {
//   return apiKey.verify(key, process.env.API_KEY_SECRET);
// };

// type Middleware = RequestHandler | JWTMiddleware | ApiKeyMiddleware;

// export const middleware: Middleware;
