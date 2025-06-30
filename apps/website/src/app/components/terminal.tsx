import { cn } from "@/utils/cn";
import styles from "./terminal.module.css";

function TerminalContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className={cn(styles.container, "p-1.5 relative")}>
      <div className="p-4 bg-black border border-gray-400">{children}</div>
      <div className="pointer-none absolute -top-1 left-4 flex gap-1.5 [&>div]:w-2 [&>div]:h-4 [&>div]:bg-black">
        <div />
        <div />
        <div />
        <div />
      </div>
    </div>
  );
}

export function Terminal() {
  return (
    <TerminalContainer>
      <div className="aspect-video">
        <div className="text-left flex gap-2 items-center leading-none">
          <code>⊹ npx create-xmcp-app</code>
          <div className="bg-white h-4 w-1.5 top-[1px] relative" />
        </div>
      </div>
    </TerminalContainer>
  );
}
