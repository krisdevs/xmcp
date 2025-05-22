import { z } from "zod";

// Define the schema for tool parameters
export const schema = z.object({
  a: z.number().describe("First number to add"),
  b: z.number().describe("Second number to add"),
});

// Define tool metadata
export const Metadata = {
  name: "add",
  description: "Add two numbers together",
  annotations: {
    title: "Add Two Numbers",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

// Tool implementation
export default async function add({ a, b }: z.infer<typeof schema>) {
  return a + b;
}
