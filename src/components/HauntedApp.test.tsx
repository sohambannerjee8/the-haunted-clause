import { render, screen } from "@testing-library/react";
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
