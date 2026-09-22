import "@fontsource/dm-sans/400.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/700.css";
import "./style.css";
import {
  languages,
  translations,
  resolveLocale,
  localizeAnswer,
  type Locale,
} from "./i18n";
import { ANSWERS, type Answer } from "./answers";
import { createBall } from "./ball";
import { createQuestionGhosts } from "./question-ghosts";

let savedLocale: string | null = null;
try {
  savedLocale = localStorage.getItem("ball-language");
} catch {}
let locale = resolveLocale(
  savedLocale ? [savedLocale, ...navigator.languages] : navigator.languages,
);
let lastAnswer: Answer | undefined;
let failed = false;
const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = `
<div class="language-picker"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/></svg><select id="language">${Object.entries(
  languages,
)
  .map(
    ([code, name]) => `<option value="${code}" lang="${code}">${name}</option>`,
  )
  .join("")}</select></div>
<main>
<div id="stage" role="region" tabindex="0" aria-label="Magic 8 ball. Drag to rotate, or use arrow keys. Home resets the view."></div>
<form aria-label="Ask the ball"><p id="status" class="sr-only" role="status" aria-live="polite"></p><label class="sr-only" for="question">Your yes or no question</label><div class="question-field"><input id="question" name="question" dir="auto" placeholder="Ask a question…" minlength="2" maxlength="500" autocomplete="off" required/><button class="ask" type="submit" aria-label="Ask the ball"><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5m-6 6 6-6 6 6"/></svg></button></div></form>
</main>
<footer><span><span id="credit">made by</span> <a href="https://kualta.dev" target="_blank" rel="noopener">kualta</a></span><a class="social" href="https://x.com/kualts" target="_blank" rel="noopener" aria-label="kualta · X"><svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a><a class="social" href="https://bsky.app/profile/kualta.dev" target="_blank" rel="noopener" aria-label="kualta · Bluesky"><svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.022-.276.04-.415.056-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.05 9.271 7.733 4.308 4.267-4.308 1.172-6.498-2.74-7.078a8.741 8.741 0 0 1-.415-.056c.14.017.279.036.415.056 2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.478 0-.69-.139-1.861-.902-2.206-.659-.298-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8Z"/></svg></a></footer>`;
const input = document.querySelector<HTMLInputElement>("#question")!;
const status = document.querySelector<HTMLElement>("#status")!;
const ask = document.querySelector<HTMLButtonElement>(".ask")!;
const form = document.querySelector<HTMLFormElement>("form")!;
const stage = document.querySelector<HTMLElement>("#stage")!;
const ghosts = createQuestionGhosts(stage);
let busy = false;
let ball: Awaited<ReturnType<typeof createBall>> | undefined;
createBall(stage, translations[locale].prompt)
  .then((value) => {
    ball = value;
    applyLocale();
  })
  .catch(() => {
    stage.innerHTML = '<div class="fallback-ball"><span>8</span></div>';
  });

input.addEventListener("input", () => {
  ball?.setDraft(input.value.length);
});

function showAnswer(canonical: Answer) {
  lastAnswer = canonical;
  const answer = localizeAnswer(canonical, locale);
  ball?.setState("answer", answer);
  stage.setAttribute(
    "aria-label",
    `${answer}. ${translations[locale].controls}`,
  );
  const fallback = stage.querySelector(".fallback-ball span");
  if (fallback) {
    fallback.textContent = answer;
    fallback.classList.add("answer");
  }
  status.textContent = answer;
}

async function evaporateInput() {
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const animation = input.animate(
      [
        { opacity: 1, filter: "blur(0px)", transform: "translateY(0)" },
        { opacity: 0, filter: "blur(6px)", transform: "translateY(-12px)" },
      ],
      { duration: 650, easing: "cubic-bezier(.2,.6,.3,1)", fill: "forwards" },
    );
    try {
      await animation.finished;
    } catch {}
    input.value = "";
    animation.cancel();
  } else input.value = "";
  ball?.setDraft(0);
}

async function submit() {
  if (busy || !input.value.trim()) return;
  const question = input.value.trim();
  busy = true;
  failed = false;
  ask.disabled = true;
  input.readOnly = true;
  form.setAttribute("aria-busy", "true");
  status.className = "sr-only";
  status.textContent = translations[locale].thinking;
  ball?.setState("thinking");
  ghosts.start(question);
  const evaporation = evaporateInput();
  try {
    const response = await fetch("/api/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
      signal: AbortSignal.timeout(25000),
    });
    const result = await response.json();
    if (!response.ok) throw new Error("Couldn't get an answer. Try again.");
    if (!ANSWERS.includes(result.answer)) throw new Error("Invalid answer");
    showAnswer(result.answer);
  } catch {
    await evaporation;
    input.value = question;
    ball?.setDraft(question.length);
    failed = true;
    status.className = "error";
    status.textContent = translations[locale].error;
    ball?.setState("error", translations[locale].answers[11]);
  } finally {
    ghosts.stop();
    await evaporation;
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

const languageSelect = document.querySelector<HTMLSelectElement>("#language")!;
function applyLocale() {
  const copy = translations[locale];
  document.documentElement.lang = locale;
  document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  languageSelect.value = locale;
  languageSelect.setAttribute("aria-label", copy.language);
  input.placeholder = copy.prompt;
  input.setAttribute("aria-label", copy.question);
  document.querySelector('label[for="question"]')!.textContent = copy.question;
  form.setAttribute("aria-label", copy.ask);
  ask.setAttribute("aria-label", copy.ask);
  document.querySelector("#credit")!.textContent = copy.credit;
  stage.setAttribute("aria-label", copy.controls);
  if (busy) status.textContent = copy.thinking;
  else if (failed) {
    status.textContent = copy.error;
    ball?.setText(copy.answers[11]!);
  } else if (lastAnswer) {
    const answer = localizeAnswer(lastAnswer, locale);
    ball?.setText(answer);
    status.textContent = answer;
    stage.setAttribute("aria-label", `${answer}. ${copy.controls}`);
    const fallback = stage.querySelector(".fallback-ball span");
    if (fallback) fallback.textContent = answer;
  } else ball?.setText(copy.prompt);
}
languageSelect.addEventListener("change", () => {
  locale = languageSelect.value as Locale;
  try {
    localStorage.setItem("ball-language", locale);
  } catch {}
  applyLocale();
});
applyLocale();
