import { fetchArticle, fetchSidebar } from "@/basehub/actions";
import { findNavigationItems } from "@/utils/find-navigation-items";
import { notFound } from "next/navigation";
import { ArticleNavigation } from "@/components/layout/navigation";

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
      <div className="flex-1 px-4 py-8">content</div>
      <div className="w-52 shrink-0 py-8 sticky top-0 h-fit">
        <h1>{article._title}</h1>
        <ArticleNavigation prev={prev} next={next} />
      </div>
    </div>
  );
}
