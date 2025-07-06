import { cn } from "@/utils/cn";
import Link from "next/link";

const cards = [
  {
    title: "Create a new XMCP app",
    description: "Bootstrap your MCP server with one command.",
    href: "/docs#create-a-new-xmcp-app",
  },
  {
    title: "Next.js",
    description: "Plug an MCP server into your existing Next.js app.",
    href: "/docs#usage-with-nextjs-experimental",
  },
  {
    title: "Express",
    description: "Add an MCP server to any existing Express app.",
    href: "/docs#usage-with-express-experimental",
  },
];

export function GetStartedSection() {
  return (
    <div className="space-y-6">
      <h2 className="max-w-[30rem] mx-auto text-2xl">Get started</h2>
      <div className="grid grid-cols-2 gap-8">
        <GetStartedCard className="col-span-2" {...cards[0]} />
        <GetStartedCard {...cards[1]} />
        <GetStartedCard {...cards[2]} />
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
          "block text-left group relative overflow-visible",
          className
        )}
      >
        <div
          className="top-1 left-1 absolute w-full h-full group-hover:border group-hover:visible invisible"
          style={{ borderColor: "#333" }}
        ></div>
        <div
          className="relative border border-muted p-4 group-hover:bg-black"
          style={{ borderColor: "#333" }}
        >
          <h3 className="pb-[5rem] italic">
            {title}{" "}
            <span className="invisible group-hover:visible">{"->"}</span>
          </h3>
          <p>{description}</p>
        </div>
      </Link>
    </>
  );
}
