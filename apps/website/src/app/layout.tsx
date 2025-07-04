import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { Toolbar } from "basehub/next-toolbar";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";

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
    siteName: "xmcp",
    images: "/og-image.png",
    url: "https://xmcp.dev",
    type: "website",
    locale: "en_US",
    title: "xmcp | The MCP framework",
    description: "The framework for building & shipping MCP applications.",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-[100dvh] flex flex-col max-w-[1200px] mx-auto font-mono`}
      >
        <div className="grow relative">
          <Header />
          {children}
          <Footer />
        </div>
        <Toolbar />
        <Analytics />
      </body>
    </html>
  );
}
