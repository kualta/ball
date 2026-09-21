import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/800.css";
import "./style.css";
import { createBall } from "./ball";

const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = `
<header><a class="wordmark" href="/" aria-label="Ball home">ball<span class="brand-dot"></span></a><button class="about-button" aria-expanded="false" aria-controls="about">An old ritual, reimagined <span>↗</span></button></header>
<main><div class="intro"><p class="eyebrow">A LITTLE ROOM FOR POSSIBILITY</p><h1>Ask the unknown.</h1><p class="subtitle">Something on your mind? Give it a spin.</p></div>
<div id="stage" role="img" aria-label="A glossy magic 8 ball with a blue floating answer die"><div class="loading-orb"></div></div>
<section class="interaction" aria-label="Ask the magic 8 ball"><p id="status" role="status" aria-live="polite">Twenty answers. One question.</p><form><label class="sr-only" for="question">Your yes or no question</label><div class="question-field"><input id="question" name="question" placeholder="Will it all work out?" maxlength="500" autocomplete="off" required/><button class="ask" type="submit" aria-label="Ask the ball"><span>Ask</span><span aria-hidden="true">↗</span></button></div><div class="form-meta"><span>A yes-or-no question works best.</span><span id="counter">0 / 500</span></div></form><p id="connection" class="connection"></p><button id="demo" class="text-button" hidden>Try a classic random spin</button><details id="probabilities" hidden><summary>The possibilities <span>+</span></summary><p class="probability-note">Model confidence in each reply, not the odds of a future event.</p><div id="distribution"></div></details></section>
</main><footer><span>A small ritual for a big maybe.</span><span>POWERED BY <a href="https://typesafe.ai/" target="_blank" rel="noreferrer">JEV</a></span></footer>
<dialog id="about"><button class="close" aria-label="Close">×</button><p class="eyebrow">MEET BALL</p><h2>Same mystery.<br>A little more intelligence.</h2><p>The twenty classic answers, suspended in blue. Ask a yes-or-no question and Jev weighs the possible replies. The ball draws an answer from that distribution.</p><p>This is a playful perspective, not a prediction. Questions are sent to TypeSafe AI to generate a response.</p><p class="fine">The liquid uses a real-time optical simulation, with a buoyant, damped answer die.</p></dialog>`;
const input = document.querySelector<HTMLInputElement>("#question")!;
const status = document.querySelector<HTMLElement>("#status")!;
const ask = document.querySelector<HTMLButtonElement>(".ask")!;
const demo = document.querySelector<HTMLButtonElement>("#demo")!;
const connection = document.querySelector<HTMLElement>("#connection")!;
const probabilities =
  document.querySelector<HTMLDetailsElement>("#probabilities")!;
let busy = false;
let ball: Awaited<ReturnType<typeof createBall>> | undefined;
createBall(document.querySelector("#stage")!)
  .then((value) => {
    ball = value;
    document.querySelector(".loading-orb")?.remove();
  })
  .catch(() => {
    document.querySelector("#stage")!.innerHTML =
      '<div class="fallback-ball"><span>8</span></div>';
  });
input.addEventListener("input", () => {
  document.querySelector("#counter")!.textContent =
    `${input.value.length} / 500`;
});
fetch("/api/status")
  .then((r) => r.json())
  .then((data) => {
    if (!data.configured) {
      connection.textContent =
        "Jev is not connected. You can still try a classic random spin.";
      demo.hidden = false;
    }
  })
  .catch(() => {
    connection.textContent = "Could not reach the ball. Please try again.";
  });
async function submit(isDemo = false) {
  if (busy || !input.value.trim()) {
    input.focus();
    return;
  }
  busy = true;
  ask.disabled = true;
  demo.disabled = true;
  input.readOnly = true;
  probabilities.hidden = true;
  status.textContent = "Turning it over…";
  ball?.setState("thinking");
  try {
    const started = Date.now();
    const response = await fetch("/api/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: input.value.trim(), demo: isDemo }),
      signal: AbortSignal.timeout(25000),
    });
    const result = await response.json();
    if (!response.ok)
      throw new Error(
        result.error || "The ball could not answer. Please try again.",
      );
    await new Promise((resolve) =>
      setTimeout(resolve, Math.max(0, 2600 - (Date.now() - started))),
    );
    ball?.setState("answer", result.answer);
    status.textContent = result.answer;
    connection.textContent =
      result.source === "demo"
        ? "Classic mode · a random answer, without Jev."
        : "A perspective, not a prediction.";
    const rows = [...result.probabilities].sort(
      (a, b) => b.probability - a.probability,
    );
    const distribution = document.querySelector("#distribution")!;
    distribution.replaceChildren();
    for (const row of rows) {
      const line = document.createElement("div");
      line.className = "probability-row";
      const label = document.createElement("span");
      label.textContent = row.answer;
      const value = document.createElement("span");
      value.textContent = `${(row.probability * 100).toFixed(1)}%`;
      const bar = document.createElement("i");
      bar.style.width = `${Math.max(0, Math.min(100, row.probability * 100))}%`;
      line.append(label, value, bar);
      distribution.append(line);
    }
    probabilities.hidden = result.source !== "jev";
  } catch (error) {
    status.textContent =
      error instanceof Error
        ? error.message
        : "Something went wrong. Try again.";
    ball?.setState("error");
  } finally {
    busy = false;
    ask.disabled = false;
    demo.disabled = false;
    input.readOnly = false;
  }
}
document.querySelector("form")!.addEventListener("submit", (event) => {
  event.preventDefault();
  void submit();
});
demo.addEventListener("click", () => {
  if (!input.value.trim()) input.value = "Will it all work out?";
  document.querySelector("#counter")!.textContent =
    `${input.value.length} / 500`;
  void submit(true);
});
const about = document.querySelector<HTMLDialogElement>("#about")!;
const aboutButton = document.querySelector<HTMLButtonElement>(".about-button")!;
aboutButton.addEventListener("click", () => {
  about.showModal();
  aboutButton.setAttribute("aria-expanded", "true");
});
about.querySelector("button")!.addEventListener("click", () => about.close());
about.addEventListener("close", () =>
  aboutButton.setAttribute("aria-expanded", "false"),
);
about.addEventListener("click", (event) => {
  if (event.target === about) about.close();
});
