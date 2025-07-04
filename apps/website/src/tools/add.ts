import { z } from "zod";

// Define the schema for tool parameters
export const schema = {
  a: z.number().describe("The first number"),
  b: z.number().describe("The second number"),
};

// Define tool metadata
export const metadata = {
  name: "add",
  description: "Add two numbers",
  annotations: {
    title: "Add two numbers",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

// Tool implementation
export default async function add({ a, b }: { a: number; b: number }) {
  return {
    content: [{ type: "text", text: `${a} + ${b} = ${a + b}` }],
  };
}
