"use client";

import * as React from "react";
import { createHighlighter } from "shiki";

const highlighter = await createHighlighter({
  themes: ["github-dark-high-contrast", "vesper"],
  langs: ["typescript", "bash", "json", "tsx"],
});

const preContext = React.createContext<{ editor: boolean }>({ editor: false });

export function Code({
  children,
  className,
  ...props
}: Omit<React.ComponentProps<"code">, "children"> & { children: string }) {
  const { editor } = React.useContext(preContext);

  if (!editor) {
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  }

  const lang = className?.split("-")[1];

  let theme = "none";

  if (lang && lang !== "bash") {
    theme = "github-dark-high-contrast";
  }

  const codeHTML = highlighter.codeToHtml(children, {
    theme,
    lang: lang || "typescript",
  });
  return (
    <code
      className={`${className} [&>pre]:p-0 [&>pre]:!bg-transparent`}
      dangerouslySetInnerHTML={{ __html: codeHTML }}
      {...props}
    />
  );
}

export function Pre({ children }: { children: React.ReactNode }) {
  return (
    <pre className="border border-white relative w-auto overflow-x-auto bg-black">
      <preContext.Provider value={{ editor: true }}>
        {children}
      </preContext.Provider>
    </pre>
  );
}

/*
<pre className="terminal-container relative w-auto">
  <div className="p-4 bg-black border border-gray-400 overflow-x-auto">
    <preContext.Provider value={{ editor: true }}>
      {children}
    </preContext.Provider>
  </div>
</pre>
*/
