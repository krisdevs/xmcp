import { client } from "./client";
import {
  Article,
  ArticleFragment,
  AssetsFragment,
  SidebarTreeFragment,
} from "./fragments";

export const fetchArticle = async (slug: string): Promise<Article | null> => {
  const res = await client().query({
    documentation: {
      articles: {
        __args: {
          filter: { _sys_slug: { eq: slug } },
          first: 1,
        },
        item: {
          ...ArticleFragment,
        },
      },
    },
  });

  return res.documentation.articles.item;
};

export const fetchSidebar = async () => {
  const res = await client().query({
    documentation: {
      sidebarTree: {
        ...SidebarTreeFragment,
      },
    },
  });

  return res.documentation.sidebarTree.items;
};

export const fetchAssets = async () => {
  const res = await client().query({
    assets: {
      ...AssetsFragment,
    },
  });

  return res.assets;
};
