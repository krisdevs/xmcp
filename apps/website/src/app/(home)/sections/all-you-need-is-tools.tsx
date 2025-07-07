import { Code, Pre } from "@/components/markdown/code-blocks";

export function AllYouNeedIsToolsSection() {
  return (
    <div className="space-y-12 ">
      <h2 className="w-full mx-auto text-xl uppercase">
        All you need is /tools
      </h2>
      <div className="prose !text-left [&_span]:!text-muted [&_span:nth-child(4)_span]:!text-white">
        <Pre>
          <Code lang="text">
            {`my-project/
├── src/
│   ├── middleware.ts   # Middleware for http request/response processing
│   └── tools/          # Tool files are auto-discovered here
│       ├── greet.ts
│       ├── search.ts
├── dist/               # Built output (generated)
├── package.json
├── tsconfig.json
└── xmcp.config.ts       # Configuration file for xmcp`}
          </Code>
        </Pre>
      </div>
    </div>
  );
}
