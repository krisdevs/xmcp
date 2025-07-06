import { AnimatedLink } from "@/components/terminal/animated-link";

export const Header = () => {
  return (
    <header className="sticky top-0 right-0 left-0 max-w-[1200px] mx-auto bg-transparent z-50 flex justify-center items-center">
      <div
        className="
          pointer-events-none
          absolute left-1/2 top-0 -translate-x-1/2
          w-full
          max-w-[800px] h-full
        "
        style={{
          background: "rgba(0, 0, 0, 0.25)",
          backdropFilter: "blur(8px)",
          maskImage:
            "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.7) 80%, rgba(0,0,0,0) 100%)",
        }}
        aria-hidden="true"
      />
      <div className="relative max-w-[800px] w-full flex justify-center items-center px-4 py-8 text-center text-md text-white font-mono gap-8">
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
