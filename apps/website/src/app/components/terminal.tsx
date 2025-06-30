import styles from "./terminal.module.css";

function TerminalContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.container}>
      <div>{children}</div>
    </div>
  );
}

export function Terminal() {
  return <TerminalContainer>Test</TerminalContainer>;
}
