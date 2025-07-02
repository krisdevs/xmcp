"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { cn } from "@/utils/cn";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

// Define the type based on your BaseHub data structure
type SidebarData = {
  _title: string;
  _slug: string;
  target?: {
    _title: string;
    _slug: string;
  };
  collection: {
    items: {
      _title: string;
      _slug: string;
      target: {
        _title: string;
        _slug: string;
      };
    }[];
  };
}[];

export function SidebarClient({ sidebar }: { sidebar: SidebarData }) {
  const router = useRouter();
  const pathname = usePathname();

  // Extract the active slug from pathname
  // Remove '/docs/' prefix and split by '/' to get the slug parts
  const pathParts = pathname.replace("/docs/", "").split("/").filter(Boolean);
  const [parentSlug, childSlug] = pathParts;

  // Route prefetching - adapt to BaseHub structure with nested routes
  useEffect(() => {
    sidebar.forEach((item) => {
      // Prefetch the parent item if it has a target
      if (item.target?._slug) {
        router.prefetch(`/docs/${item.target._slug}`);
      }

      // Prefetch all collection items with nested routes
      item.collection?.items?.forEach((collectionItem) => {
        const nestedRoute = item.target
          ? `${item.target._slug}/${collectionItem.target._slug}`
          : collectionItem.target._slug;
        router.prefetch(`/docs/${nestedRoute}`);
      });
    });
  }, [router, sidebar]);

  return (
    <div className="sticky top-8">
      <Sidebar>
        <SidebarHeader>Documentation</SidebarHeader>
        <SidebarMenu>
          {sidebar.map((item) => {
            const isParentActive = item.target?._slug === parentSlug;

            return (
              <Collapsible key={item._slug} defaultOpen={true}>
                <SidebarMenuItem>
                  <div className="flex items-center w-full">
                    {/* Clickable parent item */}
                    {item.target ? (
                      <SidebarMenuSubButton
                        href={`/docs/${item.target._slug}`}
                        isActive={isParentActive}
                        className={cn(
                          "text-white hover:text-white font-medium flex-1",
                          isParentActive &&
                            "data-[active=true]:text-white data-[active=true]:hover:text-white"
                        )}
                      >
                        {item._title}
                      </SidebarMenuSubButton>
                    ) : (
                      <SidebarMenuButton className="text-white hover:text-white font-medium flex-1">
                        {item._title}
                      </SidebarMenuButton>
                    )}

                    {/* Separate collapse trigger */}
                    <CollapsibleTrigger asChild>
                      <button className="p-1 text-white hover:text-white opacity-50 hover:opacity-100 ml-2">
                        <svg
                          className="h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-90"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                    </CollapsibleTrigger>
                  </div>

                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {/* Render collection items with nested routes */}
                      {item.collection?.items?.map((collectionItem) => {
                        const nestedRoute = item.target
                          ? `${item.target._slug}/${collectionItem.target._slug}`
                          : collectionItem.target._slug;

                        // Check if this collection item is active
                        const isChildActive =
                          childSlug === collectionItem.target._slug &&
                          parentSlug === item.target?._slug;

                        return (
                          <SidebarMenuSubItem key={collectionItem._slug}>
                            <SidebarMenuSubButton
                              href={`/docs/${nestedRoute}`}
                              isActive={isChildActive}
                              className={cn(
                                isChildActive &&
                                  "data-[active=true]:text-white data-[active=true]:hover:text-white"
                              )}
                            >
                              <span
                                className={cn(
                                  isChildActive && "text-white hover:text-white"
                                )}
                              >
                                {collectionItem.target._title}
                              </span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            );
          })}
        </SidebarMenu>
      </Sidebar>
    </div>
  );
}
