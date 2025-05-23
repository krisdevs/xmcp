import { z } from "zod";
import { type InferSchema } from "xmcp";

// Define the schema for tool parameters
export const schema = {
  a: z.number().describe("First number to multiply"),
  b: z.number().describe("Second number to multiply"),
};

// Define tool metadata
export const metadata = {
  name: "multiply",
  description: "Multiply two numbers together",
  annotations: {
    title: "Multiply Two Numbers",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

// Tool implementation
export default async function multiply({ a, b }: InferSchema<typeof schema>) {
  return {
    content: [{ type: "text", text: String(a * b) }],
  };
}
