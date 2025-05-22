export function generateImportCode(pathlist: string[]): string {
  const importCode = pathlist.map(path => {
    return `"${path}": import("${path}"),`
  }).join('\n')

  return `export const tools = {\n${importCode}\n}`
}