import { AnimatedLink } from "@/components/terminal/animated-link";
import styles from "./progressive-blur.module.css";

export const Header = () => {
  return (
    <header className="sticky top-0 right-0 left-0 w-full mx-auto bg-transparent z-50 flex justify-center items-center">
      <div
        className={`
          pointer-events-none
          absolute inset-0
          w-full h-full
          ${styles.progressiveBlur}
        `}
        aria-hidden="true"
      >
        <div></div>
        <div></div>
        <div></div>
      </div>
      <div className="z-[6] relative max-w-[800px] w-full flex justify-center items-center px-4 py-8 text-center text-md text-white font-mono gap-8">
        <AnimatedLink href="/">Home</AnimatedLink>
        <span
          className="bg-clip-text text-transparent [-webkit-background-clip:text] [-webkit-text-fill-color:transparent] text-[1.3em] relative -top-[0.12em]"
          style={{
            background:
              "linear-gradient(207deg, #CFCFCF 29.21%, #868686 69.52%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          xmcp
        </span>
        <AnimatedLink href="/docs">Docs</AnimatedLink>
      </div>
    </header>
  );
};
