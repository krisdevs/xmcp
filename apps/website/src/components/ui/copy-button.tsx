"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/utils/cn";
import { Icons } from "@/components/ui/icons";

export const CopyButton = ({
  text,
  className,
  theme = "light",
}: {
  text: string;
  className?: string;
  theme?: "light" | "dark";
}) => {
  const [copied, setCopied] = useState(false);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCopiedRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    try {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      await navigator.clipboard.writeText(text);
      setCopied(true);
      lastCopiedRef.current = Date.now();

      timeoutRef.current = setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  return (
    <div
      className={cn("relative grid justify-items-center", className)}
      onMouseEnter={() => {
        if (copied && Date.now() - lastCopiedRef.current > 500) {
          setCopied(false);
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
        }
      }}
    >
      <button
        className={cn(
          "absolute size-6 grid place-items-center z-20 cursor-pointer transition-all duration-300 rounded-sm hover:bg-spiral-black/5 border border-transparent hover:border-spiral-black/20",
          theme === "dark" &&
            "hover:bg-spiral-white/10 hover:border-spiral-white/30"
        )}
        onClick={handleCopy}
      >
        <div className="relative size-full grid place-items-center">
          <Icons.lightCheck
            className={cn(
              "absolute h-[10px] w-auto transition-all duration-300 will-change-transform",
              copied
                ? "opacity-100 scale-100 animate-in fade-in"
                : "opacity-0 scale-30 animate-out fade-out",
              theme === "dark" && "[&_path]:stroke-spiral-white"
            )}
          />
          <Icons.copy
            className={cn(
              "absolute size-4 transition-all duration-300 will-change-transform",
              copied
                ? "opacity-0 scale-30 animate-out fade-out"
                : "opacity-100 scale-100 animate-in fade-in",
              theme === "dark" && "[&_path]:stroke-spiral-white"
            )}
          />
        </div>
      </button>
    </div>
  );
};
