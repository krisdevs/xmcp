// app/api/[transport]/route.ts
import { createMcpHandler } from "@vercel/mcp-adapter";
const handler = createMcpHandler((server) => {
  server.tool("roll_dice", "Rolls an N-sided die", {}, async () => {
    const value = 1 + Math.floor(Math.random() * 6);
    return {
      content: [{ type: "text", text: `🎲 You rolled a ${value}!` }],
    };
  });
});
export { handler as GET, handler as POST };
