import { fragmentOn } from "basehub";

export const ArticleFragment = fragmentOn("ArticleComponent", {
  _title: true,
  _slug: true,
  body: {
    readingTime: true,
    json: {
      content: true,
    },
  },
  ogImage: {
    url: true,
  },
  _sys: {
    lastModifiedAt: true,
  },
});

export type Article = fragmentOn.infer<typeof ArticleFragment>;

const SidebarTreeComponentFragment = fragmentOn("SidebarTreeComponent", {
  _title: true,
  _slug: true,
  target: {
    ...ArticleFragment,
  },
  collection: {
    items: {
      _title: true,
      _slug: true,
      target: {
        ...ArticleFragment,
      },
    },
  },
});

export const SidebarTreeFragment = fragmentOn("SidebarTree", {
  items: {
    ...SidebarTreeComponentFragment,
  },
});
