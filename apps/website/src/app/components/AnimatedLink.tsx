"use client";
import Link from "next/link";
import { useState } from "react";

interface AnimatedLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export default function AnimatedLink({
  href,
  children,
  className = "",
}: AnimatedLinkProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
    setIsExiting(false);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setIsExiting(true);
    // Reset after exit animation completes
    setTimeout(() => {
      setIsExiting(false);
    }, 200);
  };

  return (
    <Link
      href={href}
      target="_blank"
      className={`relative ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      <div
        className="absolute bottom-0 left-0 right-0 h-px bg-white transition-transform duration-200 ease-out"
        style={{
          transform: isHovered
            ? "scaleX(1)"
            : isExiting
              ? "scaleX(1)"
              : "scaleX(0)",
          transformOrigin: isHovered ? "left" : "right",
        }}
      />
    </Link>
  );
}
