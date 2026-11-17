import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

// Record the props MotionConfig receives, keeping the rest of motion/react real.
const motionConfigProps: Record<string, unknown>[] = [];
vi.mock("motion/react", async (importOriginal) => {
  const real = await importOriginal<typeof import("motion/react")>();
  return {
    ...real,
    MotionConfig: (props: { children?: ReactNode; [k: string]: unknown }) => {
      motionConfigProps.push(props);
      return <>{props.children}</>;
    },
  };
});

// The analyzer is mocked only to reach its too-long path, which the 50,000 cap normally prevents (R16.6).
let tooLong = false;
vi.mock("../lib/analyzer/analyze", async (importOriginal) => {
  const real = await importOriginal<typeof import("../lib/analyzer/analyze")>();
  return {
    ...real,
    analyze: (text: string) =>
      tooLong ? { ok: false as const, error: { code: "too-long" as const, length: 50_001, limit: 50_000 as const } } : real.analyze(text),
  };
});

const { HauntedApp } = await import("./HauntedApp");

describe("HauntedApp", () => {
  it('renders inside MotionConfig with reducedMotion="user" (R10.3)', () => {
    render(<HauntedApp llmAvailable={false} />);
    expect(motionConfigProps.length).toBeGreaterThan(0);
    expect(motionConfigProps.at(-1)!.reducedMotion).toBe("user");
    // The whole app, including main, is inside it.
    expect(screen.getByRole("main")).toBeInTheDocument();
  });
});

describe("HauntedApp edge paths", () => {
  it("stays on the input screen with the too-long message when the analyzer returns too-long (R16.6)", async () => {
    tooLong = true;
    try {
      render(<HauntedApp llmAvailable={false} />);
      const box = screen.getByLabelText("Paste a Terms & Conditions or privacy policy");
      await userEvent.type(box, "We may sell your data.");
      await userEvent.click(screen.getByRole("button", { name: "Analyze" }));
      expect(await screen.findByText("That text is longer than 50,000 characters.")).toBeInTheDocument();
      expect(screen.getByLabelText("Paste a Terms & Conditions or privacy policy")).toHaveValue("We may sell your data.");
      expect(screen.queryByRole("heading", { level: 2, name: "Inside the house" })).toBeNull();
    } finally {
      tooLong = false;
    }
  });
  it("opens the house for the same text when the analyzer accepts it", async () => {
    render(<HauntedApp llmAvailable={false} />);
    await userEvent.type(screen.getByLabelText("Paste a Terms & Conditions or privacy policy"), "We may sell your data.");
    await userEvent.click(screen.getByRole("button", { name: "Analyze" }));
    expect(await screen.findByRole("heading", { level: 2, name: "Inside the house" })).toBeInTheDocument();
  });
});
