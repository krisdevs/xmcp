// packages/xmcp/src/types/tool.ts
import { z } from "zod";

export interface ToolAnnotations {
  title?: string;
  readOnlyHint?: boolean;
  destructiveHint?: boolean;
  idempotentHint?: boolean;
  openWorldHint?: boolean;
  [key: string]: any;
}

export interface ToolMetadata {
  name: string;
  description: string;
  annotations?: ToolAnnotations;
}

export interface Tool {
  type: string;
  handler: (args: any) => any;
  metadata: ToolMetadata;
  schema: Record<string, z.ZodType>;
}
