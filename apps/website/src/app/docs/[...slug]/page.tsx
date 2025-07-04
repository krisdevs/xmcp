import { fetchArticle, fetchSidebar } from "@/basehub/actions";
import { findNavigationItems } from "@/utils/find-navigation-items";
import { notFound } from "next/navigation";
import { ArticleNavigation } from "@/components/layout/navigation";
import { ArticleContent } from "@/components/article/content";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const slug = (await params).slug;
  const articleSlug = slug[slug.length - 1];
  const sidebarTree = await fetchSidebar();
  const { prev, next } = findNavigationItems(sidebarTree, slug);

  const article = await fetchArticle(articleSlug);

  if (!article) {
    notFound();
  }

  return (
    <div className="flex gap-8 w-full flex-col">
      <div className="flex-1 py-8">
        <ArticleContent article={article} />
        <ArticleNavigation prev={prev} next={next} />
      </div>
    </div>
  );
}
