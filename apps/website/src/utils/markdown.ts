import fs from "fs";
import path from "path";
import matter from "gray-matter";

export interface MarkdownFrontmatter {
  title?: string;
  description?: string;
  order?: number;
  [key: string]: unknown;
}

export interface MarkdownFile {
  slug: string;
  title: string;
  content: string;
  data: MarkdownFrontmatter;
  path: string;
  order: number;
}

export interface SidebarItem {
  title: string;
  slug: string;
  children?: SidebarItem[];
  order: number;
}

const DOCS_DIRECTORY = path.join(process.cwd(), "src/docs");

// Extract numeric prefix from filename (e.g., "01-introduction.mdx" -> { order: 1, cleanName: "introduction" })
function extractOrderFromFilename(filename: string): {
  order: number;
  cleanName: string;
} {
  const match = filename.match(/^(\d+)[-_](.+)$/);
  if (match) {
    return {
      order: parseInt(match[1], 10),
      cleanName: match[2],
    };
  }
  return {
    order: 999,
    cleanName: filename,
  };
}

function isIndexFile(filename: string): boolean {
  const { cleanName } = extractOrderFromFilename(filename);
  return cleanName.replace(/\.(md|mdx)$/, "") === "index";
}

function generateTitleFromFilename(filename: string): string {
  const { cleanName } = extractOrderFromFilename(filename);
  const nameWithoutExtension = cleanName.replace(/\.(md|mdx)$/, "");
  return nameWithoutExtension
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function getAllMarkdownFiles(): MarkdownFile[] {
  const files: MarkdownFile[] = [];

  function readDirectory(dir: string, basePath = ""): void {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);

      if (stat.isDirectory()) {
        const { cleanName: cleanDirName } = extractOrderFromFilename(item);
        readDirectory(itemPath, path.join(basePath, cleanDirName));
      } else if (item.endsWith(".mdx")) {
        const fileContent = fs.readFileSync(itemPath, "utf8");
        const { data, content } = matter(fileContent);

        const { order, cleanName } = extractOrderFromFilename(item);

        let rawSlug: string;
        if (isIndexFile(item)) {
          // For root-level index files, use "index" as the slug
          rawSlug = basePath === "" ? "index" : basePath;
        } else {
          rawSlug = path.join(basePath, cleanName.replace(/\.mdx$/, ""));
        }

        const slug = rawSlug.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
        const title = data.title || generateTitleFromFilename(item);

        files.push({
          slug,
          title,
          content,
          data,
          path: itemPath,
          order: data.order || order,
        });
      }
    }
  }

  if (fs.existsSync(DOCS_DIRECTORY)) {
    readDirectory(DOCS_DIRECTORY);
  }

  return files;
}

export function getMarkdownFileBySlug(slug: string): MarkdownFile | null {
  const files = getAllMarkdownFiles();

  const normalizedSlug = slug.replace(/^\/+|\/+$/g, "").replace(/\\/g, "/");

  const found = files.find((file) => file.slug === normalizedSlug);

  if (!found) {
    console.warn(`❌ Could not find markdown file for slug: "${slug}"`);
    console.log("📁 Available files:");
    files.forEach((file) => {
      console.log(`  - ${file.slug}`);
    });
  }

  return found || null;
}

export function generateSidebarTree(): SidebarItem[] {
  const files = getAllMarkdownFiles();
  const tree: SidebarItem[] = [];

  const groups: { [key: string]: MarkdownFile[] } = {};
  const directoryOrders: { [key: string]: number } = {};

  files.forEach((file) => {
    const filename = path.basename(file.path);
    const fileDirectory = path.dirname(file.path);
    const parentDirName = fileDirectory.split(path.sep).pop() || "";

    if (isIndexFile(filename)) {
      const { cleanName: cleanDirName } =
        extractOrderFromFilename(parentDirName);
      const key = cleanDirName;
      if (!groups[key]) groups[key] = [];
      groups[key].push(file);

      const { order } = extractOrderFromFilename(parentDirName);
      directoryOrders[key] = order;
    } else {
      const parts = file.slug.split("/");
      if (parts.length === 1) {
        const key = "";
        if (!groups[key]) groups[key] = [];
        groups[key].push(file);
      } else {
        const directory = parts.slice(0, -1).join("/");
        if (!groups[directory]) groups[directory] = [];
        groups[directory].push(file);

        const originalDirName =
          path.dirname(file.path).split(path.sep).pop() || "";
        const { order } = extractOrderFromFilename(originalDirName);
        directoryOrders[directory] = order;
      }
    }
  });

  Object.keys(groups).forEach((key) => {
    groups[key].sort((a, b) => {
      if (a.order !== b.order) {
        return a.order - b.order;
      }
      return a.title.localeCompare(b.title);
    });
  });

  const sortedKeys = Object.keys(groups).sort();

  for (const key of sortedKeys) {
    if (key === "") {
      groups[key].forEach((file) => {
        tree.push({
          title: file.title,
          slug: file.slug,
          order: file.order,
        });
      });
    } else {
      const directoryName = key.split("/").pop() || key;
      let formattedTitle = directoryName
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      // handle fetching the root index file
      if (formattedTitle === "Docs") {
        formattedTitle = "Documentation";
      }

      const children = groups[key]
        .filter((file) => {
          const filename = path.basename(file.path);
          return !isIndexFile(filename);
        })
        .map((file) => ({
          title: file.title,
          slug: file.slug,
          order: file.order,
        }));

      const directoryOrder = directoryOrders[key] || 999;

      tree.push({
        title: formattedTitle,
        // handle fetching the root index file
        slug: key === "docs" ? "" : key,
        children,
        order: directoryOrder,
      });
    }
  }

  tree.sort((a, b) => {
    if (a.order !== b.order) {
      return a.order - b.order;
    }
    return a.title.localeCompare(b.title);
  });

  console.log(tree);

  return tree;
}

export function findNavigationItems(
  sidebar: SidebarItem[],
  currentSlug: string
): {
  prev: SidebarItem | null;
  next: SidebarItem | null;
} {
  const flatItems: SidebarItem[] = [];

  function flatten(items: SidebarItem[]): void {
    items.forEach((item) => {
      if (item.children) {
        flatten(item.children);
      } else {
        flatItems.push(item);
      }
    });
  }

  flatten(sidebar);

  const currentIndex = flatItems.findIndex((item) => item.slug === currentSlug);

  return {
    prev: currentIndex > 0 ? flatItems[currentIndex - 1] : null,
    next:
      currentIndex < flatItems.length - 1 ? flatItems[currentIndex + 1] : null,
  };
}
