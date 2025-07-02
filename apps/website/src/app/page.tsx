import { Terminal } from "./components/terminal";
import { CavasLogo } from "./components/three-logo";

export default function Home() {
  return (
    <div className="font-mono h-[calc(100vh-8rem)] flex items-center justify-center">
      <div
        className="max-w-[40rem] mx-auto text-center flex flex-col px-8"
        style={{ gap: "calc(var(--spacing) * 12)" }}
      >
        <h1 className="text-lg">xmcp_</h1>
        <CavasLogo />
        <Terminal />
        <h2 className="max-w-[30rem] mx-auto text-2xl">
          The framework for building & shipping MCP applications.
        </h2>
        <p className="text-sm text-balance text-white/50 -mt-6">
          Designed with DX in mind, it streamlines development and lowers the
          barrier to entry for anyone looking to create and deploy powerful
          tools on top of the MCP ecosystem.
        </p>
      </div>
    </div>
  );
}
