import { Terminal } from "./components/terminal";

export default function Home() {
  return (
    <div className="font-[family-name:var(--font-geist-sans)]">
      <div className="max-w-[40rem] mx-auto">
        <Terminal />
      </div>
    </div>
  );
}
