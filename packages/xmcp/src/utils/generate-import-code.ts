export function generateImportCode(
  pathlist: string[],
  middlewarePaths: string[]
): string {
  const importToolsCode = pathlist
    .map((path) => {
      const relativePath = `../${path}`;
      return `"${path}": () => import("${relativePath}"),`;
    })
    .join("\n");

  const importMiddlewareCode = middlewarePaths
    .map((path) => {
      const relativePath = `../${path}`;
      return `"middleware": () => import("${relativePath}"),`;
    })
    .join("\n");

  return `
export const tools = {
${importToolsCode}
};
export const middleware = {
${importMiddlewareCode}
};
`;
}
