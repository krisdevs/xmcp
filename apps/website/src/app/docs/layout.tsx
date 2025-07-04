import { Sidebar } from "@/components/layout/sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar />
      <div className="flex-1 flex justify-center">
        <div className="w-full max-w-[400px]">{children}</div>
      </div>
    </SidebarProvider>
  );
}
