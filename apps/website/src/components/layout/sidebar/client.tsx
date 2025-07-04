"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { cn } from "@/utils/cn";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { XmcpLogo } from "@/components/terminal/logo/client";

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

export function SidebarClient({
  sidebar,
  matcap,
}: {
  sidebar: SidebarData;
  matcap: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [openItems, setOpenItems] = useState<Record<string, boolean>>(() =>
    sidebar.reduce((acc, item) => ({ ...acc, [item._slug]: true }), {})
  );

  const pathParts = pathname.replace("/docs/", "").split("/").filter(Boolean);
  const [parentSlug, childSlug] = pathParts;

  useEffect(() => {
    sidebar.forEach((item) => {
      if (item.target?._slug) {
        router.prefetch(`/docs/${item.target._slug}`);
      }

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
        <div className="flex justify-center py-6 px-4">
          <div className="relative w-[150px] h-[150px] flex items-center justify-center mx-auto">
            <XmcpLogo matcap={matcap} />
          </div>
        </div>
        <SidebarMenu>
          {sidebar.map((item) => {
            const isParentActive = item.target?._slug === parentSlug;

            return (
              <Collapsible
                key={item._slug}
                defaultOpen={true}
                onOpenChange={(isOpen) => {
                  setOpenItems((prev) => ({
                    ...prev,
                    [item._slug]: isOpen,
                  }));
                }}
              >
                <SidebarMenuItem>
                  <div className="flex items-center w-full">
                    {item.target ? (
                      <SidebarMenuSubButton
                        href={`/docs/${item.target._slug}`}
                        isActive={isParentActive}
                        className={cn(
                          "font-mono uppercase font-medium flex-1",
                          isParentActive
                            ? "text-white hover:text-white data-[active=true]:text-white data-[active=true]:hover:text-white"
                            : "text-[rgba(153,153,153,1)] hover:text-white"
                        )}
                      >
                        {item._title}
                      </SidebarMenuSubButton>
                    ) : (
                      <SidebarMenuButton className="font-mono uppercase text-[rgba(153,153,153,1)] hover:text-white font-medium flex-1">
                        {item._title}
                      </SidebarMenuButton>
                    )}

                    <CollapsibleTrigger asChild>
                      <button className="p-1 text-[rgba(153,153,153,1)] hover:text-white opacity-50 hover:opacity-100 ml-2">
                        <svg
                          className={cn(
                            "h-4 w-4 transition-transform duration-200",
                            openItems[item._slug] && "rotate-90"
                          )}
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

                  <CollapsibleContent className="transition-all duration-200 ease-in-out overflow-hidden">
                    <SidebarMenuSub>
                      {item.collection?.items?.map((collectionItem) => {
                        const nestedRoute = item.target
                          ? `${item.target._slug}/${collectionItem.target._slug}`
                          : collectionItem.target._slug;

                        const isChildActive =
                          childSlug === collectionItem.target._slug &&
                          parentSlug === item.target?._slug;

                        return (
                          <SidebarMenuSubItem key={collectionItem._slug}>
                            <SidebarMenuSubButton
                              href={`/docs/${nestedRoute}`}
                              isActive={isChildActive}
                              className={cn(
                                "font-mono uppercase",
                                isChildActive
                                  ? "data-[active=true]:text-white data-[active=true]:hover:text-white"
                                  : "text-[rgba(153,153,153,1)] hover:text-white"
                              )}
                            >
                              <span
                                className={cn(
                                  "font-mono uppercase",
                                  isChildActive
                                    ? "text-white hover:text-white"
                                    : "text-[rgba(153,153,153,1)] hover:text-white"
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
