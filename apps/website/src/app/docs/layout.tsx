import { Sidebar } from "@/components/layout/sidebar";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "xmcp — Documentation",
  description: "The documentation for the xmcp framework.",
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Sidebar />
      <div className="flex-1 flex justify-center">
        <div className="w-full max-w-[700px]">{children}</div>
      </div>
    </>
  );
}
