import { Terminal } from "./components/terminal";

export default function Home() {
  return (
    <div className="font-mono py-8">
      <div className="max-w-[40rem] mx-auto px-2 text-center flex flex-col gap-8">
        <h1 className="text-lg">xmcp_</h1>
        <Terminal />
      </div>
    </div>
  );
}
