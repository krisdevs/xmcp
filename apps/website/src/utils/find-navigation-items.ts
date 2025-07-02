import { SidebarTreeComponent } from "../../basehub";

export type NavigationItem = {
  _slug: string;
  _title: string;
};

export function findNavigationItems(
  tree: SidebarTreeComponent[],
  currentSlug: string | string[]
): { prev: NavigationItem | null; next: NavigationItem | null } {
  const flattenedItems: NavigationItem[] = [];

  function flattenTree(items: SidebarTreeComponent[]) {
    items?.forEach((item) => {
      if (item.target) {
        flattenedItems.push({
          _slug: item.target._slug,
          _title: item.target._title,
        });
      }

      if (item.collection?.items?.length > 0) {
        const parentSlug = item._slug;
        item.collection.items.forEach((collectionItem) => {
          if (collectionItem.target) {
            const hierarchicalSlug = parentSlug
              ? `${parentSlug}/${collectionItem.target._slug}`
              : collectionItem.target._slug;

            flattenedItems.push({
              _slug: hierarchicalSlug,
              _title: collectionItem.target._title,
            });
          }
        });
      }
    });
  }

  flattenTree(tree);

  const slugToMatch = Array.isArray(currentSlug)
    ? currentSlug.join("/")
    : currentSlug;

  const currentIndex = flattenedItems.findIndex(
    (item) => item._slug === slugToMatch
  );

  return {
    prev: currentIndex > 0 ? flattenedItems[currentIndex - 1] : null,
    next:
      currentIndex < flattenedItems.length - 1
        ? flattenedItems[currentIndex + 1]
        : null,
  };
}
