"use client";

import Link from "next/link";
import { cn } from "@/utils/cn";

interface AnimatedLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export const AnimatedLink = ({
  href,
  children,
  className = "",
}: AnimatedLinkProps) => {
  return (
    <Link
      href={href}
      target="_blank"
      className={cn("relative group uppercase", className)}
    >
      {children}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 h-px bg-white transition-transform duration-200 ease-out",
          "scale-x-0 origin-right",
          "group-hover:scale-x-100 group-hover:origin-left"
        )}
      />
    </Link>
  );
};
