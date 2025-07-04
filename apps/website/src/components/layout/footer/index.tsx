import { AnimatedLink } from "@/components/terminal/animated-link";

export const Footer = () => {
  return (
    <footer className="text-center text-sm text-white flex flex-col-reverse sm:flex-row uppercase py-8 px-4 font-mono gap-4 justify-between w-full">
      <div className="flex-1 flex justify-center sm:justify-start">
        <span className="block">
          © 2025{" "}
          <AnimatedLink href="https://basement.studio">
            BASEMENT.STUDIO
          </AnimatedLink>
        </span>
      </div>
      <div className="flex-1 flex gap-4 justify-center sm:justify-end">
        <AnimatedLink href="https://npmjs.com/package/xmcp">NPM</AnimatedLink>
        <AnimatedLink href="https://github.com/basementstudio/xmcp">
          GitHub
        </AnimatedLink>
        <AnimatedLink href="https://x.com/xmcp_dev">X</AnimatedLink>
        <AnimatedLink href="https://discord.gg/FPRuDAhPX9">
          Discord
        </AnimatedLink>
      </div>
    </footer>
  );
};
