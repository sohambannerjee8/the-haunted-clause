import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// next/font/local is compiled by Next.js at build time; in Vitest it is a plain stub.
vi.mock("next/font/local", () => ({
  default: (options: { variable?: string }) => ({
    className: "next-font",
    variable: options.variable ? `var-${options.variable.replace(/^--/, "")}` : "",
    style: { fontFamily: "stub" },
  }),
}));

// Vitest runs without globals, so Testing Library's automatic cleanup is not registered. Unmount after each test.
afterEach(() => cleanup());
