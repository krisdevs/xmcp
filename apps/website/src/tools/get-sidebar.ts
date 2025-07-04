import { fetchSidebar } from "@/basehub/actions";

// Define the schema for tool parameters
export const schema = {};

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
export default async function getSidebar() {
  const sidebar = await fetchSidebar();

  const result = JSON.stringify(sidebar);

  return {
    content: [{ type: "text", text: result }],
  };
}
