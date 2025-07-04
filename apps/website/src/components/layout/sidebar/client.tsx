"use client";

import { cn } from "@/utils/cn";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { XmcpLogo } from "@/components/terminal/logo/client";
import * as Accordion from "@radix-ui/react-accordion";
import Link from "next/link";
import { SidebarItem } from "@/utils/markdown";

export function SidebarClient({
  sidebar,
  matcap,
}: {
  sidebar: SidebarItem[];
  matcap: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const parentSlugs = sidebar
    .filter((item) => item.children && item.children.length > 0)
    .map((item) => item.slug);
  const [openAccordions, setOpenAccordions] = useState<string[]>(parentSlugs);

  const pathParts = pathname.replace("/docs/", "").split("/").filter(Boolean);
  const [parentSlug, childSlug] = pathParts;

  const handleLinkClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      const href = event.currentTarget.getAttribute("href");
      if (href) {
        router.push(href);
      }
    },
    [router]
  );

  const handleLinkClickWithAccordion = useCallback(
    (accordionId: string) => (event: React.MouseEvent<HTMLAnchorElement>) => {
      handleLinkClick(event);

      if (!openAccordions.includes(accordionId)) {
        setOpenAccordions((prev) => [...prev, accordionId]);
      }
    },
    [handleLinkClick, openAccordions]
  );

  useEffect(() => {
    sidebar.forEach((item) => {
      if (item.slug) {
        router.prefetch(`/docs/${item.slug}`);
      }

      item.children?.forEach((child) => {
        router.prefetch(`/docs/${child.slug}`);
      });
    });
  }, [router, sidebar]);

  return (
    <div className="absolute left-0 top-0 hidden h-full lg:block lg:w-[280px]">
      <nav className="sticky left-8 top-0 z-10 flex h-auto min-h-[600px] flex-col px-8 lg:h-[calc(100dvh-64px)]">
        <div className="flex justify-center">
          <div className="relative w-[150px] h-[150px] flex items-center justify-center mx-auto">
            <XmcpLogo matcap={matcap} />
          </div>
        </div>

        <div className="relative mb-10 mt-6 flex flex-col gap-2.5 overflow-y-auto">
          <Accordion.Root
            type="multiple"
            className="flex flex-col gap-2"
            value={openAccordions}
            onValueChange={setOpenAccordions}
          >
            {sidebar.map((item) => {
              const isParentActive = item.slug === parentSlug;

              return (
                <div key={item.slug} className="flex relative flex-col">
                  {item.children && item.children.length > 0 ? (
                    <Accordion.Item value={item.slug} className="group">
                      <div
                        className={cn(
                          "flex w-full items-center justify-between rounded-lg p-3 leading-[114%] transition-colors duration-150",
                          isParentActive
                            ? "text-white"
                            : "text-[rgba(153,153,153,1)] hover:text-white"
                        )}
                      >
                        <Link
                          href={`/docs/${item.slug}`}
                          onClick={handleLinkClickWithAccordion(item.slug)}
                          className="flex-1 text-left font-mono uppercase font-medium"
                        >
                          {item.title}
                        </Link>
                        <Accordion.Trigger asChild>
                          <button
                            type="button"
                            className="p-1 ml-2 transition-colors text-[rgba(153,153,153,1)] hover:text-white opacity-50 hover:opacity-100"
                            aria-label={`Toggle ${item.title} section`}
                          >
                            <svg
                              className={cn(
                                "h-4 w-4 -rotate-90 transition-transform duration-150 group-data-[state=open]:rotate-0"
                              )}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </button>
                        </Accordion.Trigger>
                      </div>
                      <Accordion.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                        <div className="pb-2 mt-3 ml-3 border-l border-gray-600">
                          <div className="flex flex-col gap-1">
                            {item.children.map((child) => {
                              const isChildActive =
                                child.slug === `${parentSlug}/${childSlug}`;

                              return (
                                <Link
                                  key={child.slug}
                                  href={`/docs/${child.slug}`}
                                  onClick={handleLinkClick}
                                  className={cn(
                                    "rounded-lg p-3 leading-[114%] transition-colors duration-150 font-mono uppercase",
                                    isChildActive
                                      ? "text-white"
                                      : "text-[rgba(153,153,153,1)] hover:text-white"
                                  )}
                                >
                                  {child.title}
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      </Accordion.Content>
                    </Accordion.Item>
                  ) : (
                    <Link
                      href={`/docs/${item.slug}`}
                      onClick={handleLinkClick}
                      className={cn(
                        "w-full rounded-lg p-3 leading-[114%] transition-colors duration-150 font-mono uppercase font-medium",
                        isParentActive
                          ? "text-white"
                          : "text-[rgba(153,153,153,1)] hover:text-white hover:bg-[rgba(255,255,255,0.05)]"
                      )}
                    >
                      {item.title}
                    </Link>
                  )}
                </div>
              );
            })}
          </Accordion.Root>
        </div>
      </nav>
    </div>
  );
}
