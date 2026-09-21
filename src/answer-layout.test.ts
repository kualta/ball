import { test, expect } from "bun:test";
import { ANSWERS } from "./answers";
import { layoutAnswer, triangleWidth } from "./answer-layout";
test("every classic answer fits within the lower edge of each text row", () => {
  const measure = (text: string, size: number) => text.length * size * 0.75;
  for (const answer of [...ANSWERS, "ASK A QUESTION"]) {
    const { size, lines } = layoutAnswer(answer, measure);
    expect(lines.map((line) => line.text).join(" ")).toBe(answer.toUpperCase());
    for (const line of lines) {
      expect(measure(line.text, size)).toBeLessThanOrEqual(
        triangleWidth(line.y + size * 0.6),
      );
      expect(line.y + size * 0.6).toBeLessThan(444);
    }
  }
});
