import {
  generateSidebarTree,
  getMarkdownFileBySlug,
  findNavigationItems,
} from "@/utils/markdown";
import { notFound } from "next/navigation";
import { ArticleNavigation } from "@/components/layout/navigation";
import { CustomMDX } from "@/components/markdown/renderer";

export default async function Page({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const slug = (await params).slug;
  const articleSlug = slug ? slug.join("/") : "index";

  console.log(articleSlug);

  const sidebarTree = generateSidebarTree();
  const { prev, next } = findNavigationItems(sidebarTree, articleSlug);

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
        <ArticleNavigation prev={prev} next={next} />
      </div>
    </div>
  );
}
