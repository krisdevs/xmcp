export function generateImportCode(
  pathlist: string[],
  hasMiddleware: boolean
): string {
  const importToolsCode = pathlist
    .map((path) => {
      const relativePath = `../${path}`;
      return `"${path}": () => import("${relativePath}"),`;
    })
    .join("\n");

  const importMiddlewareCode = hasMiddleware
    ? `export const middleware = () => import("../src/middleware"),`
    : "";

  return `
export const tools = {
${importToolsCode}
};

${importMiddlewareCode}
`;
}
