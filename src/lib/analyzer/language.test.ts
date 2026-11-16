import { describe, expect, it } from "vitest";
import { COMMON_ENGLISH, likelyNonEnglish } from "./language";

const ENGLISH =
  "We may share your personal information with our partners. You can delete your account at any time. These terms apply to all users of the service.";
const SPANISH =
  "Podemos compartir sus datos personales con terceros para fines publicitarios y de análisis. Al usar el servicio, usted acepta estas condiciones.";
const FRENCH =
  "Nous pouvons partager vos données avec nos partenaires commerciaux. En utilisant le service, vous acceptez ces conditions générales.";
const JAPANESE =
  "当社は、お客様の個人情報を第三者と共有する場合があります。本サービスを利用することにより、お客様はこれらの条件に同意したものとみなされます。";

describe("likelyNonEnglish (R9)", () => {
  it("is false when the text has fewer than 40 letters (R9.2)", () => {
    expect(likelyNonEnglish("")).toBe(false);
    expect(likelyNonEnglish("Hola amigo, ¿qué tal?")).toBe(false);
    expect(likelyNonEnglish("こんにちは")).toBe(false);
  });

  it("is true when fewer than half of the letters are ASCII (R9.3)", () => {
    expect(likelyNonEnglish(JAPANESE)).toBe(true);
  });

  it("is true for Spanish and French, which pass the ASCII test but use few common English words (R9.4)", () => {
    expect(likelyNonEnglish(SPANISH)).toBe(true);
    expect(likelyNonEnglish(FRENCH)).toBe(true);
  });

  it("is false for an English policy paragraph (R9.5)", () => {
    expect(likelyNonEnglish(ENGLISH)).toBe(false);
  });

  it("uses a fixed list of about 60 common words, all lowercase", () => {
    expect(COMMON_ENGLISH.size).toBeGreaterThanOrEqual(55);
    for (const w of COMMON_ENGLISH) expect(w).toBe(w.toLowerCase());
  });
});
