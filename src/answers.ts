export const ANSWERS = [
  "It is certain",
  "It is decidedly so",
  "Without a doubt",
  "Yes definitely",
  "You may rely on it",
  "As I see it, yes",
  "Most likely",
  "Outlook good",
  "Yes",
  "Signs point to yes",
  "Reply hazy, try again",
  "Ask again later",
  "Better not tell you now",
  "Cannot predict now",
  "Concentrate and ask again",
  "Don't count on it",
  "My reply is no",
  "My sources say no",
  "Outlook not so good",
  "Very doubtful",
] as const;

export type Answer = (typeof ANSWERS)[number];
export type Probability = { answer: Answer; probability: number };
export type AnswerResult = {
  answer: Answer;
  probabilities: Probability[];
  source: "jev" | "demo";
};

export function parseDistribution(value: unknown): Probability[] {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid distribution");
  const record = value as Record<string, unknown>;
  if (Object.keys(record).length !== ANSWERS.length)
    throw new Error("Incomplete distribution");
  const probabilities = ANSWERS.map((answer) => {
    const probability = record[answer];
    if (
      typeof probability !== "number" ||
      !Number.isFinite(probability) ||
      probability < 0 ||
      probability > 1
    ) {
      throw new Error("Invalid probability");
    }
    return { answer, probability };
  });
  const total = probabilities.reduce((sum, item) => sum + item.probability, 0);
  if (Math.abs(total - 1) > 0.02)
    throw new Error("Distribution must sum to one");
  return probabilities.map((item) => ({
    ...item,
    probability: item.probability / total,
  }));
}

export function sampleAnswer(
  probabilities: Probability[],
  random = Math.random(),
): Answer {
  if (!Number.isFinite(random) || random < 0 || random >= 1)
    throw new Error("Invalid random sample");
  let cumulative = 0;
  for (const item of probabilities) {
    cumulative += item.probability;
    if (random < cumulative) return item.answer;
  }
  return probabilities[probabilities.length - 1]!.answer;
}
