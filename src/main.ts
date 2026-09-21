import "@fontsource/dm-sans/400.css";
import "@fontsource/manrope/800.css";
import "./style.css";
import { createBall } from "./ball";

const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = `
<header><a class="wordmark" href="/" aria-label="Ball home">ball<span class="brand-dot"></span></a></header>
<main>
<div id="stage" role="img" aria-label="Magic 8 ball"><div class="loading-orb"></div></div>
<form aria-label="Ask the ball"><p id="status" class="sr-only" role="status" aria-live="polite"></p><label class="sr-only" for="question">Your yes or no question</label><div class="question-field"><input id="question" name="question" placeholder="Ask a question…" minlength="2" maxlength="500" autocomplete="off" required/><button class="ask" type="submit" aria-label="Ask the ball"><span aria-hidden="true">↗</span></button></div></form>
</main>`;
const input = document.querySelector<HTMLInputElement>("#question")!;
const status = document.querySelector<HTMLElement>("#status")!;
const ask = document.querySelector<HTMLButtonElement>(".ask")!;
const form = document.querySelector<HTMLFormElement>("form")!;
const stage = document.querySelector<HTMLElement>("#stage")!;
let busy = false;
let ball: Awaited<ReturnType<typeof createBall>> | undefined;
createBall(stage)
  .then((value) => {
    ball = value;
    document.querySelector(".loading-orb")?.remove();
  })
  .catch(() => {
    stage.innerHTML = '<div class="fallback-ball"><span>8</span></div>';
  });

function showAnswer(answer: string) {
  ball?.setState("answer", answer);
  stage.setAttribute("aria-label", `Magic 8 ball: ${answer}`);
  const fallback = stage.querySelector(".fallback-ball span");
  if (fallback) {
    fallback.textContent = answer;
    fallback.classList.add("answer");
  }
  status.textContent = answer;
}

async function submit() {
  if (busy || !input.value.trim()) return;
  busy = true;
  ask.disabled = true;
  input.readOnly = true;
  form.setAttribute("aria-busy", "true");
  status.className = "sr-only";
  status.textContent = "Turning it over…";
  ball?.setState("thinking");
  try {
    const started = Date.now();
    const response = await fetch("/api/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: input.value.trim() }),
      signal: AbortSignal.timeout(25000),
    });
    const result = await response.json();
    if (!response.ok) throw new Error("Couldn't get an answer. Try again.");
    await new Promise((resolve) =>
      setTimeout(resolve, Math.max(0, 2600 - (Date.now() - started))),
    );
    showAnswer(result.answer);
  } catch {
    status.className = "error";
    status.textContent = "Couldn't get an answer. Try again.";
    ball?.setState("error");
  } finally {
    busy = false;
    ask.disabled = false;
    input.readOnly = false;
    form.setAttribute("aria-busy", "false");
  }
}
form.addEventListener("submit", (event) => {
  event.preventDefault();
  void submit();
});
