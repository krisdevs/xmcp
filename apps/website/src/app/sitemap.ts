import { getAllMarkdownFiles } from "@/utils/markdown";

export const baseUrl = "https://xmcp.dev";

export default async function sitemap() {
  const docs = getAllMarkdownFiles().map((file) => ({
    url: `${baseUrl}/docs/${file.slug}`,
    lastModified: new Date().toISOString().split("T")[0],
  }));

  const routes = ["", "/docs"].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString().split("T")[0],
  }));

  return [...routes, ...docs];
}
