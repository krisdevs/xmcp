import { z } from "zod";

// Define the schema for tool parameters
export const schema = z.object({
  a: z.number().describe("First number to multiply"),
  b: z.number().describe("Second number to multiply"),
});

// Define tool metadata
export const Metadata = {
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
export default async function multiply({ a, b }: z.infer<typeof schema>) {
  return {
    content: [{ type: "text", text: String(a * b) }],
  };
}
