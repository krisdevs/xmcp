import { XmcpLogo } from "@/components/terminal/logo";
import { Terminal } from "@/components/terminal/terminal";
import Link from "next/link";

export function IntroSection() {
  return (
    <div className="min-h-[calc(100vh-88px)] flex flex-col items-stretch justify-center">
      <div className="space-y-6 pb-12">
        <div className="relative w-[150px] md:w-[200px] lg:w-[220px] aspect-square flex items-center justify-center mx-auto">
          <XmcpLogo />
        </div>
        <h2 className="max-w-[30rem] mx-auto text-2xl">
          The framework for building & shipping MCP applications
        </h2>
        <p className="text-sm text-balance text-white/50">
          Designed with DX in mind, it simplifies setup and removes friction in
          just one command — making it easy to build & deploy AI /tools on top
          of the MCP ecosystem
        </p>
        <div className="space-y-4 text-left mt-12">
          <Terminal>npx create-xmcp-app</Terminal>
          <p>
            <i>Bootstrap your MCP server with one command</i>
          </p>
          <Terminal className="mt-12">npx init-xmcp</Terminal>
          <p>
            <i>
              Plug into your existing{" "}
              <Link
                href="https://nextjs.org"
                target="_blank"
                className="underline text-white"
              >
                Next.js
              </Link>{" "}
              or{" "}
              <Link
                href="https://expressjs.com"
                target="_blank"
                className="underline text-white"
              >
                Express
              </Link>{" "}
              app
            </i>
          </p>
        </div>
      </div>
    </div>
  );
}
