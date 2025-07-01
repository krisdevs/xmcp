import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AnimatedLink from "./components/AnimatedLink";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "xmcp | The MCP framework",
  description: "The framework for building & shipping MCP applications.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    images: "/og-image.png",
  },
  manifest: "/site.webmanifest",
  appleWebApp: {
    title: "xmcp",
  },
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
        <footer className="text-center text-sm text-white flex flex-col lg:flex-row uppercase p-8 font-mono gap-4">
          <div className="flex-1 justify-center flex gap-4">
            <AnimatedLink href="https://github.com/basementstudio/xmcp">
              GitHub
            </AnimatedLink>
            <AnimatedLink href="https://npmjs.com/package/xmcp">
              NPM
            </AnimatedLink>
          </div>
          <div className="flex-1 justify-center flex">
            <span className="block">
              © 2025{" "}
              <AnimatedLink href="https://basement.studio">
                BASEMENT.STUDIO
              </AnimatedLink>
            </span>
          </div>
          <div className="flex-1 justify-center flex gap-4">
            <AnimatedLink href="https://x.com/xmcp_dev">X</AnimatedLink>
            <AnimatedLink href="https://discord.gg/FPRuDAhPX9">
              Discord
            </AnimatedLink>
          </div>
        </footer>
      </body>
    </html>
  );
}
