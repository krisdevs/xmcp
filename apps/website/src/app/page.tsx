import Image from "next/image";
import { Terminal } from "./components/terminal";
import logo from "@public/xmcp-logo.svg";

export default function Home() {
  return (
    <div className="font-mono py-8">
      <div className="max-w-[40rem] mx-auto text-center flex flex-col gap-8 px-8">
        <h1 className="text-lg">xmcp_</h1>
        <Image
          width={110}
          height={110}
          className="mx-auto"
          src={logo}
          alt="XMCP Logo"
        />
        <Terminal />
        <h2 className="max-w-[20rem] mx-auto">
          The framework for building & shipping MCP applications.
        </h2>
        <p className="text-sm text-balance text-white/50">
          Designed with DX in mind, it streamlines development and lowers the
          barrier to entry for anyone looking to create and deploy powerful
          tools on top of the MCP ecosystem.
        </p>
      </div>
    </div>
  );
}
