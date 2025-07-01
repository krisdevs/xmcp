import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "xmcp",
  description: "The framework for building & shipping MCP applications.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-[100svh] flex flex-col`}
      >
        <div className="grow relative">{children}</div>
        <footer className="text-center text-sm text-white flex flex-col lg:flex-row uppercase p-8 font-mono [&_a:hover]:underline gap-4">
          <div className="flex-1 justify-center flex gap-4">
            <Link target="_blank" href="https://github.com/basementstudio/xmcp">
              GitHub
            </Link>
            <Link target="_blank" href="https://npmjs.com/package/xmcp">
              NPM
            </Link>
          </div>
          <div className="flex-1 justify-center flex">
            <span className="block">
              © 2025{" "}
              <Link target="_blank" href="https://basement.studio">
                BASEMENT.STUDIO
              </Link>
            </span>
          </div>
          <div className="flex-1 justify-center flex gap-4">
            <Link target="_blank" href="https://x.com/xmcp_dev">
              X
            </Link>
            <Link target="_blank" href="https://discord.gg/FPRuDAhPX9">
              Discord
            </Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
