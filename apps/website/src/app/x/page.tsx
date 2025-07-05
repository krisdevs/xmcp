import { XmcpLogo } from "@/components/terminal/logo";

export default async function Page() {
  return (
    <div className="min-h-[calc(100vh-12rem)]">
      <div className="absolute inset-0 w-full h-full">
        <XmcpLogo />
      </div>
    </div>
  );
}
