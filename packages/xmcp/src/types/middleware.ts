import { type RequestHandler } from "express";

export type Middleware = RequestHandler | RequestHandler[];
