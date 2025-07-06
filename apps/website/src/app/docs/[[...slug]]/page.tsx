import { getMarkdownFileBySlug } from "@/utils/markdown";
import {
  getMarkdownFileSlugs,
  type MarkdownFileInfo,
} from "@/utils/markdown/get-markdown-files";
import { notFound } from "next/navigation";
import { CustomMDX } from "@/components/markdown/renderer";

export default async function Page({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const slug = (await params).slug;
  const articleSlug = slug ? slug.join("/") : "index";

  const article = getMarkdownFileBySlug(articleSlug);

  if (!article) {
    notFound();
  }

  return (
    <div className="flex gap-8 w-full flex-col">
      <div className="flex-1 pt-[4rem]">
        <article className="prose">
          <CustomMDX source={article.content} />
        </article>
      </div>
    </div>
  );
}

export function generateStaticParams() {
  const files = getMarkdownFileSlugs();

  return files.map((file: MarkdownFileInfo) => ({
    slug: file.slug === "index" ? [] : file.slug.split("/"),
  }));
}
