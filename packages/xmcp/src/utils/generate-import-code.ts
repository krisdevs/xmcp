export function generateImportCode(pathlist: string[]): string {
  const importCode = pathlist
    .map((path) => {
      const relativePath = `../${path}`;
      return `"${path}": import("${relativePath}"),`;
    })
    .join("\n");

  return `export const tools = {\n${importCode}\n}`;
}
