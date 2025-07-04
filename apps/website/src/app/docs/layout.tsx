import { Sidebar } from "@/components/layout/sidebar";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Sidebar />
      <div className="flex-1 flex justify-center">
        <div className="w-full max-w-[600px]">{children}</div>
      </div>
    </>
  );
}
