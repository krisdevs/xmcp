import { IntroSection } from "./sections/intro-section";
import { FeaturesSection } from "./sections/features-section";
import { GetStartedSection } from "./sections/get-started-section";

export default async function Home() {
  return (
    <div className="font-mono min-h-[calc(100vh-12rem)] flex justify-center">
      <div className="max-w-[700px] w-full mx-auto text-center flex flex-col px-8">
        <IntroSection />
        <div
          className="flex flex-col"
          style={{
            gap: "calc(var(--spacing) * 20)",
          }}
        >
          <FeaturesSection />
          <GetStartedSection />
        </div>
      </div>
    </div>
  );
}
