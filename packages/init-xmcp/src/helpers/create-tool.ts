import fs from "fs-extra";
import path from "path";
import chalk from "chalk";

/**
 * Create tools directory and tool file
 * @param projectRoot - Project root directory
 * @param toolsPath - Path for tools directory (relative to project root)
 */
export function createTool(projectRoot: string, toolsPath: string): void {
  const toolsDirPath = path.join(projectRoot, toolsPath);

  try {
    // create tools directory
    fs.ensureDirSync(toolsDirPath);

    fs.writeFileSync(path.join(toolsDirPath, "greet.ts"), toolTemplate);

    console.log(chalk.green(`Created tool: ${toolsPath}/greet.ts`));
  } catch (error) {
    console.error(chalk.red(`Failed to create tool: ${error}`));
    throw error;
  }
}

const toolTemplate = `import { z } from "zod";
import { type InferSchema } from "xmcp";

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
  const result = \`Hello, \${name}!\`;

  return {
    content: [{ type: "text", text: result }],
  };
}
`;
