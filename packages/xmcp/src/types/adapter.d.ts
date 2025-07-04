import { Request, Response } from "express";

declare module "xmcp/adapter" {
  export const mcpHandler: (req: Request, res: Response) => Promise<void>;
}
