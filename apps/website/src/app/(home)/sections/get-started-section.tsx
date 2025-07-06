import { cn } from "@/utils/cn";
import Link from "next/link";

const cards = [
  {
    title: "Create an xmcp app",
    description: "Learn how to create an xmcp app with our documentation",
    href: "/docs#create-a-new-xmcp-app",
  },
  {
    title: "Browse examples",
    description: "Learn more about xmcp by browsing our examples",
    href: "https://github.com/basementstudio/xmcp/tree/main/examples",
  },
  {
    title: "Next.js",
    description: "Plug an xmcp app to an existing Next.js project",
    href: "/docs#usage-with-nextjs",
  },
  {
    title: "Express",
    description: "Plug an xmcp app to an existing Express project",
    href: "/docs#usage-with-express",
  },
];

export function GetStartedSection() {
  return (
    <div className="space-y-6">
      <h2 className="w-full mx-auto text-xl uppercase">Get started</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map((card, index) => (
          <GetStartedCard key={index} {...card} />
        ))}
      </div>
    </div>
  );
}

function GetStartedCard({
  className,
  title,
  description,
  href,
}: {
  className?: string;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <>
      <Link
        href={href}
        className={cn(
          "block text-left group relative overflow-visible h-full",
          className
        )}
      >
        <div
          className="top-1 left-1 absolute w-full h-full group-hover:border group-hover:visible invisible"
          style={{ borderColor: "#333" }}
        ></div>
        <div
          className="relative border border-muted p-4 group-hover:bg-black h-full min-h-[10rem] w-full flex flex-col"
          style={{ borderColor: "#333" }}
        >
          <h3 className="italic grow">
            {title}{" "}
            <span className="invisible group-hover:visible">{"->"}</span>
          </h3>
          <p>{description}</p>
        </div>
      </Link>
    </>
  );
}
