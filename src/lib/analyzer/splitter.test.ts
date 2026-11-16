import { describe, expect, it } from "vitest";
import { splitClauses } from "./splitter";

const texts = (s: string) => splitClauses(s).map((c) => c.text);
const starts = (s: string) => splitClauses(s).map((c) => c.start);

describe("splitClauses: basics (R1.3, R1.4, R1.6)", () => {
  it("returns an empty list for the empty string", () => {
    expect(splitClauses("")).toEqual([]);
  });

  it("returns one clause for whitespace-only input", () => {
    expect(splitClauses("  \n\t \n ")).toEqual([{ id: "c-0", start: 0, end: 7, text: "  \n\t \n " }]);
  });

  it("gives each clause the ID c-<start> and its exact text", () => {
    const input = "First. Second.";
    expect(splitClauses(input)).toEqual([
      { id: "c-0", start: 0, end: 7, text: "First. " },
      { id: "c-7", start: 7, end: 14, text: "Second." },
    ]);
  });

  it("keeps leading whitespace in the first clause and never makes an empty last clause", () => {
    expect(texts("  Hello. World")).toEqual(["  Hello. ", "World"]);
    expect(texts("Hello.   ")).toEqual(["Hello.   "]);
  });

  // Found by property P6 (fast-check counterexample "\r\n\nWe may sell your personal information to third parties."):
  // a paragraph break at the very start made a whitespace-only first clause.
  it("keeps a leading blank line with the first clause instead of making a whitespace-only clause", () => {
    expect(texts("\r\n\nWe may sell your data.")).toEqual(["\r\n\nWe may sell your data."]);
    expect(texts("\n\n!\n\n!")).toEqual(["\n\n!\n\n", "!"]);
    expect(texts("\n\n  - Item one.\n- Item two.")).toEqual(["\n\n  - Item one.\n", "- Item two."]);
  });
});

describe("splitClauses: terminators (R1.7)", () => {
  it("splits after . ; ? ! followed by whitespace, keeping the whitespace with the clause", () => {
    expect(texts("Is it? Yes! Done; next.")).toEqual(["Is it? ", "Yes! ", "Done; ", "next."]);
  });

  it("includes closing quotes and brackets after the terminator", () => {
    expect(texts('He said "stop." Then he left.')).toEqual(['He said "stop." ', "Then he left."]);
    expect(texts("(See above.) Next part.")).toEqual(["(See above.) ", "Next part."]);
    expect(texts("It ended.” Then more.")).toEqual(["It ended.” ", "Then more."]);
    expect(texts("A list [done.] Then more.")).toEqual(["A list [done.] ", "Then more."]);
  });

  it("does not split when no whitespace follows the terminator", () => {
    expect(texts("Up to 3.5 GB per user.")).toEqual(["Up to 3.5 GB per user."]);
    expect(texts("See example.com/terms for more.")).toEqual(["See example.com/terms for more."]);
  });

  it("splits a word that only looks like an abbreviation: zinc. Then", () => {
    expect(texts("We sell zinc. Then we ship it.")).toEqual(["We sell zinc. ", "Then we ship it."]);
  });

  it("splits after an ellipsis followed by a space", () => {
    expect(texts("We may... Then again.")).toEqual(["We may... ", "Then again."]);
  });
});

describe("splitClauses: paragraph breaks and line endings (R1.8)", () => {
  it("splits at a blank line even without a terminator", () => {
    expect(texts("Heading\n\nBody text")).toEqual(["Heading\n\n", "Body text"]);
  });

  it("treats spaces or tabs between the two line breaks as part of the break", () => {
    expect(texts("One\n  \t\nTwo")).toEqual(["One\n  \t\n", "Two"]);
  });

  it("does not split at a single line break with no terminator or list marker", () => {
    expect(texts("line one\nline two")).toEqual(["line one\nline two"]);
  });

  it("handles CRLF line endings", () => {
    expect(texts("One\r\n\r\nTwo")).toEqual(["One\r\n\r\n", "Two"]);
    expect(texts("A.\r\nB")).toEqual(["A.\r\n", "B"]);
  });
});

describe("splitClauses: list markers (R1.9)", () => {
  it.each([
    ["-", "We collect:\n- email\n- name", ["We collect:\n", "- email\n", "- name"]],
    ["*", "We collect:\n* email\n* name", ["We collect:\n", "* email\n", "* name"]],
    ["•", "We collect:\n• email\n• name", ["We collect:\n", "• email\n", "• name"]],
    ["1.", "Steps:\n1. sign up\n2. pay", ["Steps:\n", "1. sign up\n", "2. pay"]],
    ["12)", "Steps:\n12) sign up\n13) pay", ["Steps:\n", "12) sign up\n", "13) pay"]],
    ["a)", "Rights:\na) access\nb) delete", ["Rights:\n", "a) access\n", "b) delete"]],
    ["(iv)", "Rights:\n(iv) access\n(v) delete", ["Rights:\n", "(iv) access\n", "(v) delete"]],
  ])("starts a new clause at a %s list marker", (_name, input, expected) => {
    expect(texts(input)).toEqual(expected);
  });

  it("needs a space or tab after the marker", () => {
    expect(texts("Words:\n-not a list\nmore")).toEqual(["Words:\n-not a list\nmore"]);
    expect(texts("Size:\n1.5 GB each")).toEqual(["Size:\n1.5 GB each"]);
  });

  it("does not split after the dot of a numbered list marker", () => {
    expect(texts("1. We collect data.\n2. We share it.")).toEqual(["1. We collect data.\n", "2. We share it."]);
  });
});

describe("splitClauses: abbreviations (R1.10, R1.11)", () => {
  it.each([
    ["e.g.", "We may use data, e.g. your email, for offers."],
    ["i.e.", "We keep logs, i.e. records of visits, for a year."],
    ["Inc.", "This service is run by Lanternmoth Inc. and its partners."],
    ["Ltd.", "Grimhollow Ltd. may change these terms."],
    ["Co.", "Mirebell Co. is the operator of the site."],
    ["Corp.", "Hollow Corp. owns the site."],
    ["U.S.", "Data may be stored in the U.S. and elsewhere."],
    ["No.", "See clause No. 5 for details."],
    ["Sec.", "As set out in Sec. 9 below."],
    ["etc.", "Names, emails, etc. are collected."],
    ["vs.", "Plan A vs. plan B pricing applies."],
    ["E.g.", "E.g. names are kept for a year."],
    ["I.e.", "I.e. we keep it."],
    ["Etc.", "Etc. means and so on here."],
    ["Vs.", "Vs. other plans, this one renews."],
  ])("does not end a clause after %s used mid-sentence", (_abbr, sentence) => {
    expect(texts(sentence)).toEqual([sentence]);
  });

  it("still splits at a paragraph break after etc.", () => {
    expect(texts("Names, emails, etc.\n\nNext section.")).toEqual(["Names, emails, etc.\n\n", "Next section."]);
  });

  it("still splits at a real sentence end after a non-abbreviation", () => {
    expect(texts("We sold the inc. Then left.")).toEqual(["We sold the inc. ", "Then left."]);
  });
});

describe("splitClauses: boundary resolution (R1.13, design table)", () => {
  it("indented list item after a paragraph break: one boundary, at the marker", () => {
    expect(texts("Intro.\n\n  - Item one.")).toEqual(["Intro.\n\n  ", "- Item one."]);
    expect(starts("Intro.\n\n  - Item one.")).toEqual([0, 10]);
  });

  it("indented list after a single line break", () => {
    expect(starts("We collect:\n  - email\n  - name")).toEqual([0, 14, 24]);
  });

  it("numbered list: terminator and marker snap to the same place", () => {
    expect(starts("1. We collect data.\n2. We share it.")).toEqual([0, 20]);
  });

  it("etc. before a paragraph break", () => {
    expect(starts("We, etc.\n\nNext part.")).toEqual([0, 10]);
  });

  it("never makes a whitespace-only clause when there is text", () => {
    for (const c of splitClauses("A.  \n\n  \n  - b.\n\n\n  c; \t d!")) expect(c.text.trim()).not.toBe("");
  });
});

describe("splitClauses: emoji and odd characters", () => {
  it("keeps emoji intact and loses nothing", () => {
    const input = "Boo 👻. Next 🕯️ clause.";
    expect(texts(input)).toEqual(["Boo 👻. ", "Next 🕯️ clause."]);
    expect(texts(input).join("")).toBe(input);
  });
});
