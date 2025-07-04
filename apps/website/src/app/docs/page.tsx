export default async function DocsPage() {
  return (
    <div className="w-full mx-auto h-[calc(100dvh-12rem)]  pt-[4rem]">
      <div className="prose prose-invert max-w-none font-mono">
        <h1 className="text-[2rem] uppercase">Documentation</h1>
        <h3>The framework for building & shipping MCP applications.</h3>
        <p className="text-sm text-[#999999]">
          Designed with DX in mind, it streamlines development and lowers the
          barrier to entry for anyone looking to create and deploy powerful
          tools on top of the MCP ecosystem.
        </p>
      </div>
    </div>
  );
}
