import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GEMINI_OUTPUT_JSON_SCHEMA, type ExplainClause } from "./schema";
import { SYSTEM_INSTRUCTION, renderClauses } from "./prompt";

// @google/genai is mocked: no test makes a real network call (testing.md).
const generateContent = vi.fn();
const getModel = vi.fn();
const ctorArgs: unknown[] = [];
vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = { generateContent, get: getModel };
    constructor(opts: unknown) {
      ctorArgs.push(opts);
    }
  },
  ThinkingLevel: { LOW: "LOW" },
}));

const { createGeminiProvider, defaultModel, DEFAULT_MODEL, fetchModel, modelSource } = await import("./gemini");

const clauses: ExplainClause[] = [{ id: "c-0", room: "court", severity: 3, text: "You waive any class action." }];
const fakeKey = () => "AI" + "za" + "x".repeat(35);
const signal = new AbortController().signal;

beforeEach(() => {
  generateContent.mockReset();
  getModel.mockReset();
  ctorArgs.length = 0;
  vi.stubEnv("GEMINI_API_KEY", fakeKey());
  vi.stubEnv("GEMINI_MODEL", "");
});
afterEach(() => vi.unstubAllEnvs());

describe("defaultModel", () => {
  it("is gemini-4-hydrogen when GEMINI_MODEL is unset, empty or whitespace", () => {
    expect(DEFAULT_MODEL).toBe("gemini-4-hydrogen");
    for (const v of [undefined, "", "   "]) {
      vi.stubEnv("GEMINI_MODEL", v);
      expect(defaultModel()).toBe("gemini-4-hydrogen");
      expect(modelSource()).toBe("default");
    }
  });
  it("uses a trimmed GEMINI_MODEL override", () => {
    vi.stubEnv("GEMINI_MODEL", "  gemini-custom-1 ");
    expect(defaultModel()).toBe("gemini-custom-1");
    expect(modelSource()).toBe("GEMINI_MODEL");
  });
});

describe("createGeminiProvider (R4.2, R11.2)", () => {
  it("calls models.generateContent with the required config", async () => {
    generateContent.mockResolvedValue({ text: '{"findings":[]}' });
    const text = await createGeminiProvider().explain(clauses, { signal });
    expect(text).toBe('{"findings":[]}');
    expect(generateContent).toHaveBeenCalledTimes(1);
    const [params] = generateContent.mock.calls[0];
    expect(params.model).toBe("gemini-4-hydrogen");
    expect(params.contents).toBe(renderClauses(clauses));
    expect(params.config).toMatchObject({
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseJsonSchema: GEMINI_OUTPUT_JSON_SCHEMA,
      thinkingConfig: { thinkingLevel: "LOW" },
      store: false,
      abortSignal: signal,
    });
    expect(params.config.store).toBe(false);
  });
  it("uses the GEMINI_MODEL override", async () => {
    vi.stubEnv("GEMINI_MODEL", "gemini-other");
    generateContent.mockResolvedValue({ text: "{}" });
    await createGeminiProvider().explain(clauses, { signal });
    expect(generateContent.mock.calls[0][0].model).toBe("gemini-other");
  });
  it("reads the key at call time, not when the module or provider is created (R4.5)", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    const provider = createGeminiProvider();
    expect(ctorArgs).toHaveLength(0);
    const later = fakeKey().replace(/x$/, "y");
    vi.stubEnv("GEMINI_API_KEY", later);
    generateContent.mockResolvedValue({ text: "{}" });
    await provider.explain(clauses, { signal });
    expect(ctorArgs).toEqual([{ apiKey: later }]);
  });
  it("sends only the rendered clause fields as user content (R4.3)", async () => {
    generateContent.mockResolvedValue({ text: "{}" });
    await createGeminiProvider().explain(clauses, { signal });
    const params = generateContent.mock.calls[0][0];
    expect(Object.keys(params).sort()).toEqual(["config", "contents", "model"]);
    expect(JSON.parse(params.contents)).toEqual([
      { id: "c-0", room: "The Silent Court", clauseType: "Forced arbitration and class-action waivers", ruleSeverity: 3, text: "You waive any class action." },
    ]);
  });
  it("returns an empty string when the response has no text", async () => {
    generateContent.mockResolvedValue({ text: undefined });
    await expect(createGeminiProvider().explain(clauses, { signal })).resolves.toBe("");
  });
  it("lets an SDK error reject (the handler maps it to a reason code)", async () => {
    generateContent.mockRejectedValue(new Error("network down"));
    await expect(createGeminiProvider().explain(clauses, { signal })).rejects.toThrow("network down");
  });
  it("getModel calls models.get once for the model, with the signal and the key read at call time (R16.12)", async () => {
    getModel.mockResolvedValue({ name: "models/gemini-4-hydrogen" });
    await expect(fetchModel("gemini-4-hydrogen", signal)).resolves.toEqual({ name: "models/gemini-4-hydrogen" });
    expect(getModel).toHaveBeenCalledTimes(1);
    expect(getModel).toHaveBeenCalledWith({ model: "gemini-4-hydrogen", config: { abortSignal: signal } });
    expect(ctorArgs).toEqual([{ apiKey: fakeKey() }]);
    expect(generateContent).not.toHaveBeenCalled();
  });
  it("getModel passes an SDK rejection through", async () => {
    const err = Object.assign(new Error("not found"), { status: 404 });
    getModel.mockRejectedValue(err);
    await expect(fetchModel("nope", signal)).rejects.toBe(err);
  });
  it("rejects without calling Google when there is no key", async () => {
    vi.stubEnv("GEMINI_API_KEY", "  ");
    await expect(createGeminiProvider().explain(clauses, { signal })).rejects.toThrow();
    expect(generateContent).not.toHaveBeenCalled();
    expect(ctorArgs).toHaveLength(0);
  });
});
