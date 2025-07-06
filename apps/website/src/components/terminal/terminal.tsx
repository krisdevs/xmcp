import { cn } from "@/utils/cn";
import styles from "./terminal.module.css";
import TypingEffect from "./typing-effect";

function TerminalContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(styles.container, "p-1 relative", className)}>
      <div className="p-1 px-2 bg-black border border-gray-400">{children}</div>
      <div className="pointer-none absolute -top-1 left-4 flex gap-1.5 [&>div]:w-2 [&>div]:h-4 [&>div]:bg-black">
        <div />
        <div />
        <div />
        <div />
      </div>
    </div>
  );
}

export function Terminal({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <TerminalContainer className={className}>
      <div>
        <TypingEffect>{children}</TypingEffect>
      </div>
    </TerminalContainer>
  );
}
