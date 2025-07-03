import { Sidebar } from "@/components/layout/sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen={true}>
      <main className="w-full h-full flex flex-col items-center">
        header
        <div className="w-full max-w-[1200px] mx-auto px-6 pt-16 pb-0 min-h-[100dvh]">
          <div className="flex gap-8 min-h-[40rem] relative">
            <Sidebar />
            <div className="flex-1 flex justify-center">
              <div className="w-full max-w-[400px]">{children}</div>
            </div>
          </div>
        </div>
      </main>
    </SidebarProvider>
  );
}
