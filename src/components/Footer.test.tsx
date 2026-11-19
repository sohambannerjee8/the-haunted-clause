import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Footer } from "./Footer";

describe("Footer (R1.2, R13.1)", () => {
  it("is a contentinfo landmark that says Not legal advice", () => {
    render(<Footer />);
    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveTextContent("Not legal advice");
  });
  it("says in one sentence that the readings are automated and can be wrong", () => {
    render(<Footer />);
    expect(screen.getByRole("contentinfo")).toHaveTextContent(/The readings are automated and can be wrong\./);
  });
  it("links to how it works and the source code (C25.7)", () => {
    render(<Footer />);
    const link = screen.getByRole("link", { name: "How it works and source code" });
    expect(link).toHaveAttribute("href", "https://github.com/sohambannerjee8/the-haunted-clause");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
    expect(link).toHaveClass("underline"); // not colour alone
  });
});
