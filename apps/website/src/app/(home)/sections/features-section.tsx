const features = [
  {
    title: "Hot Reloading",
    description: "Instant development feedback with automatic rebuilds",
  },
  {
    title: "File system routing",
    description: "Tools are auto-registered from src/tools",
  },
  {
    title: "TypeScript First",
    description: "Full TypeScript support with type inference",
  },
  {
    title: "Schema Validation",
    description: "Native parameter validation powered by Zod",
  },
  {
    title: "Rich Tooling",
    description: "Built-in CLI for development and building",
  },
  {
    title: "Vercel Support",
    description: "Deploy-ready for Vercel out of the box",
  },
  {
    title: "Deploy Anywhere",
    description: "Flexible deployment across any platform",
  },
];

export function FeaturesSection() {
  return (
    <div className="space-y-6">
      <h2 className="max-w-[30rem] mx-auto text-2xl">Features</h2>
      <ul className="text-left space-y-4 text-pretty">
        {features.map((feature) => (
          <Feature
            key={feature.title}
            title={feature.title}
            description={feature.description}
          />
        ))}
      </ul>
    </div>
  );
}

function Feature({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <li className="relative">
      <span className="text-white items-center gap-2">
        <span className="absolute -left-4">⊹ </span>
        <i>{title}</i>
      </span>{" "}
      - {description}
    </li>
  );
}
