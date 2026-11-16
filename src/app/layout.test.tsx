import { expect, test } from "vitest";
import type { ReactElement } from "react";
import RootLayout, { metadata } from "./layout";

type El = ReactElement<{ lang?: string; children?: ReactElement<{ children?: unknown }> }>;

test("root layout sets the English document language and wraps the page in <body>", () => {
  const child = <p>page</p>;
  const html = RootLayout({ children: child, params: Promise.resolve({}) } as LayoutProps<"/">) as El;
  expect(html.type).toBe("html");
  expect(html.props.lang).toBe("en");
  const body = html.props.children!;
  expect(body.type).toBe("body");
  expect(body.props.children).toBe(child);
});

test("metadata names the app and says it is not legal advice", () => {
  expect(metadata.title).toBe("The Haunted Clause");
  expect(String(metadata.description)).toMatch(/not legal advice/i);
});
