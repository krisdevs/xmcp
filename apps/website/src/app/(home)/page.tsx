import { IntroSection } from "./sections/intro-section";
import { FeaturesSection } from "./sections/features-section";
import { GetStartedSection } from "./sections/get-started-section";

export default async function Home() {
  return (
    <div className="font-mono min-h-[calc(100vh-12rem)] flex justify-center">
      <div
        className="max-w-[40rem] mx-auto text-center flex flex-col px-8"
        style={{ gap: "calc(var(--spacing) * 20)" }}
      >
        <IntroSection />
        <FeaturesSection />
        <GetStartedSection />
      </div>
    </div>
  );
}
