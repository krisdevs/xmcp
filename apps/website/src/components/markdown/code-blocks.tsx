"use client";

import * as React from "react";

import { createHighlighterCoreSync } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import js from "@shikijs/langs/javascript";
import ts from "@shikijs/langs/typescript";
import bash from "@shikijs/langs/bash";
import json from "@shikijs/langs/json";
import tsx from "@shikijs/langs/tsx";
import githubDarkHighContrast from "@shikijs/themes/github-dark-high-contrast";

const highlighter = createHighlighterCoreSync({
  langs: [js, ts, bash, json, tsx],
  themes: [githubDarkHighContrast],
  engine: createJavaScriptRegexEngine(),
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
    <pre
      className="my-8 border relative w-auto overflow-x-auto bg-black p-4"
      style={{ borderColor: "#333" }}
    >
      <preContext.Provider value={{ editor: true }}>
        {children}
      </preContext.Provider>
    </pre>
  );
}
