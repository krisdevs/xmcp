import { z } from "zod";
import { type InferSchema } from "xmcp";
import { headers } from "xmcp/headers";

// Define the schema for tool parameters
export const schema = {
  name: z.string().describe("The name of the user to greet"),
};

// Define tool metadata
export const metadata = {
  name: "greet",
  description: "Greet the user",
  annotations: {
    title: "Greet the user",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

// Tool implementation
export default async function greet({ name }: InferSchema<typeof schema>) {
  const headersList = headers();
  const apiKey = headersList["x-api-key"];

  return {
    content: [
      { type: "text", text: `Hello, ${name}! Your API key is ${apiKey}` },
    ],
  };
}
