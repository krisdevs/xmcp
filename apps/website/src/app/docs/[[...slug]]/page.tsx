import { getMarkdownFileBySlug } from "@/utils/markdown";
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
      <div className="flex-1 pt-10">
        <article className="prose">
          <CustomMDX source={article.content} />
        </article>
      </div>
    </div>
  );
}
