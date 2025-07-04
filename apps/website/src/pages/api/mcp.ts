import type { NextApiRequest, NextApiResponse } from "next";
import mcpHandler from "../../../xmcp-adapter";

type ResponseData = {
  message: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  await mcpHandler(req, res);
}
