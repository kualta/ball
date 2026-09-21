export interface AnswerLine {
  text: string;
  y: number;
  width: number;
}
export function triangleWidth(y: number): number {
  return Math.max(0, 512 * (1 - y / 444) - 48);
}
export function layoutAnswer(
  answer: string,
  measure: (text: string, size: number) => number,
): { size: number; lines: AnswerLine[] } {
  const words = answer.trim().toUpperCase().split(/\s+/).filter(Boolean);
  for (let size = 66; size >= 16; size -= 2) {
    const lines: AnswerLine[] = [];
    let index = 0;
    for (let row = 0; row < 5 && index < words.length; row++) {
      const y = 66 + row * size * 1.15;
      const width = triangleWidth(y + size * 0.6);
      let text = "";
      while (index < words.length) {
        const next = text ? `${text} ${words[index]}` : words[index];
        if (measure(next, size) > width) break;
        text = next;
        index++;
      }
      if (!text) break;
      lines.push({ text, y, width });
    }
    if (index === words.length) return { size, lines };
  }
  return { size: 16, lines: [] };
}
