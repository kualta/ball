import { expect, test } from "bun:test";
import { ANSWERS } from "./answers";
import {
  languages,
  translations,
  resolveLocale,
  localizeAnswer,
  type Locale,
} from "./i18n";
import { layoutAnswer, triangleWidth } from "./answer-layout";

test("resolves regional locales, ordered preferences, and unsupported fallback", () => {
  expect(resolveLocale(["pt-BR"])).toBe("pt");
  expect(resolveLocale(["zh-TW"])).toBe("zh");
  expect(resolveLocale(["xx", "es-MX", "en"])).toBe("es");
  expect(resolveLocale(["constructor"])).toBe("en");
  expect(resolveLocale([])).toBe("en");
  expect(resolveLocale(["xx"])).toBe("en");
});
test("every language provides twenty mapped answers that fit the triangle", () => {
  for (const locale of Object.keys(languages) as Locale[]) {
    const copy = translations[locale];
    expect(copy.answers).toHaveLength(20);
    for (const [index, answer] of ANSWERS.entries()) {
      expect(localizeAnswer(answer, locale)).toBe(copy.answers[index]!);
    }
    for (const answer of [...copy.answers, copy.prompt]) {
      const measure = (text: string, size: number) =>
        Array.from(text).length * size * 0.8;
      const { size, lines } = layoutAnswer(answer, measure);
      expect(lines.length).toBeGreaterThan(0);
      expect(
        lines
          .map((line) => line.text)
          .join("")
          .replace(/\s/g, ""),
      ).toBe(answer.toUpperCase().replace(/\s/g, ""));
      for (const line of lines)
        expect(measure(line.text, size)).toBeLessThanOrEqual(
          triangleWidth(line.y + size * 0.6),
        );
    }
  }
});
