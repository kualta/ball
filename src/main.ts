import "@fontsource/dm-sans/400.css";
import "@fontsource/manrope/500.css";
import "./style.css";
import { createBall } from "./ball";
import { createQuestionGhosts } from "./question-ghosts";

const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = `
<header><h1>8 Ball</h1></header>
<main>
<div id="stage" role="region" tabindex="0" aria-label="Magic 8 ball. Drag to rotate, or use arrow keys. Home resets the view."><div class="loading-orb"></div></div>
<form aria-label="Ask the ball"><p id="status" class="sr-only" role="status" aria-live="polite"></p><label class="sr-only" for="question">Your yes or no question</label><div class="question-field"><input id="question" name="question" placeholder="Ask a question…" minlength="2" maxlength="500" autocomplete="off" required/><button class="ask" type="submit" aria-label="Ask the ball"><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5m-6 6 6-6 6 6"/></svg></button></div></form>
</main>`;
const input = document.querySelector<HTMLInputElement>("#question")!;
const status = document.querySelector<HTMLElement>("#status")!;
const ask = document.querySelector<HTMLButtonElement>(".ask")!;
const form = document.querySelector<HTMLFormElement>("form")!;
const stage = document.querySelector<HTMLElement>("#stage")!;
const ghosts = createQuestionGhosts(stage);
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

input.addEventListener("input", () => {
  ball?.setDraft(input.value.length);
});

function showAnswer(answer: string) {
  ball?.setState("answer", answer);
  stage.setAttribute(
    "aria-label",
    `Magic 8 ball: ${answer}. Drag to rotate, or use arrow keys. Home resets the view.`,
  );
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
  ghosts.start(input.value.trim());
  try {
    const response = await fetch("/api/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: input.value.trim() }),
      signal: AbortSignal.timeout(25000),
    });
    const result = await response.json();
    if (!response.ok) throw new Error("Couldn't get an answer. Try again.");
    showAnswer(result.answer);
  } catch {
    status.className = "error";
    status.textContent = "Couldn't get an answer. Try again.";
    ball?.setState("error");
  } finally {
    ghosts.stop();
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
