import "@fontsource/dm-sans/400.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/700.css";
import "./style.css";
import { createBall } from "./ball";
import { createQuestionGhosts } from "./question-ghosts";

const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = `
<main>
<div id="stage" role="region" tabindex="0" aria-label="Magic 8 ball. Drag to rotate, or use arrow keys. Home resets the view."></div>
<form aria-label="Ask the ball"><p id="status" class="sr-only" role="status" aria-live="polite"></p><label class="sr-only" for="question">Your yes or no question</label><div class="question-field"><input id="question" name="question" placeholder="Ask a question…" minlength="2" maxlength="500" autocomplete="off" required/><button class="ask" type="submit" aria-label="Ask the ball"><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5m-6 6 6-6 6 6"/></svg></button></div></form>
</main>
<footer><span>made by <a href="https://kualta.dev" target="_blank" rel="noopener">kualta</a></span><a class="social" href="https://x.com/kualts" target="_blank" rel="noopener" aria-label="kualta on X"><svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a><a class="social" href="https://bsky.app/profile/kualta.dev" target="_blank" rel="noopener" aria-label="kualta on Bluesky"><svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.022-.276.04-.415.056-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.05 9.271 7.733 4.308 4.267-4.308 1.172-6.498-2.74-7.078a8.741 8.741 0 0 1-.415-.056c.14.017.279.036.415.056 2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.478 0-.69-.139-1.861-.902-2.206-.659-.298-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8Z"/></svg></a></footer>`;
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
