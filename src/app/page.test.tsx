import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "./page";

test("home page renders the app name and the not-legal-advice notice", () => {
  render(<Home />);
  expect(
    screen.getByRole("heading", { level: 1, name: "The Haunted Clause" }),
  ).toBeInTheDocument();
  expect(screen.getByText(/not legal advice/i)).toBeInTheDocument();
});
