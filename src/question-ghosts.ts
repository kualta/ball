const namespace = "http://www.w3.org/2000/svg";
const minimumOrbit = 5000;
// Letters burn out from the first to the last across this many seconds.
const sweep = 1.6;
const ringStagger = 0.12;
const letterFade = 0.6;

function depart(svg: SVGSVGElement) {
  svg.classList.add("departing");
  window.setTimeout(
    () => svg.remove(),
    (sweep + ringStagger * 3 + letterFade) * 1000 + 100,
  );
}

export function createQuestionGhosts(container: HTMLElement) {
  let active: SVGSVGElement | undefined;
  let lingering: SVGSVGElement | undefined;
  let lingerTimer: number | undefined;
  let startedAt = 0;
  let generation = 0;
  return {
    start(question: string) {
      active?.remove();
      window.clearTimeout(lingerTimer);
      if (lingering) depart(lingering);
      lingering = undefined;
      startedAt = performance.now();
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const svg = document.createElementNS(namespace, "svg");
      svg.setAttribute("viewBox", "0 0 800 600");
      svg.setAttribute("aria-hidden", "true");
      svg.classList.add("question-ghosts");
      const defs = document.createElementNS(namespace, "defs");
      svg.append(defs);
      const id = ++generation;
      for (let i = 0; i < 4; i++) {
        const path = document.createElementNS(namespace, "path");
        const name = `question-orbit-${id}-${i}`;
        path.id = name;
        const rx = 252 + i * 13;
        const ry = 188 + i * 9;
        path.setAttribute(
          "d",
          `M${400 - rx} 300a${rx} ${ry} 0 1 1 ${rx * 2} 0a${rx} ${ry} 0 1 1 ${-rx * 2} 0a${rx} ${ry} 0 1 1 ${rx * 2} 0a${rx} ${ry} 0 1 1 ${-rx * 2} 0a${rx} ${ry} 0 1 1 ${rx * 2} 0a${rx} ${ry} 0 1 1 ${-rx * 2} 0`,
        );
        defs.append(path);
        const group = document.createElementNS(namespace, "g");
        group.setAttribute("transform", `rotate(${i * 19 - 28} 400 300)`);
        group.style.setProperty("--ghost-index", String(i));
        const text = document.createElementNS(namespace, "text");
        const textPath = document.createElementNS(namespace, "textPath");
        textPath.setAttribute("href", `#${name}`);
        const letters = [...question];
        letters.forEach((letter, index) => {
          const tspan = document.createElementNS(namespace, "tspan");
          tspan.textContent = letter;
          tspan.style.setProperty(
            "--fade-delay",
            `${(index / letters.length) * sweep + i * ringStagger}s`,
          );
          textPath.append(tspan);
        });
        if (question.length > 95) {
          text.setAttribute("textLength", "980");
          text.setAttribute("lengthAdjust", "spacingAndGlyphs");
        }
        const animate = document.createElementNS(namespace, "animate");
        animate.setAttribute("attributeName", "startOffset");
        const offset = i * 8;
        animate.setAttribute("from", `${offset}%`);
        animate.setAttribute("to", `${offset + 100 / 3}%`);
        animate.setAttribute("dur", `${7 + i * 1.3}s`);
        animate.setAttribute("repeatCount", "indefinite");
        textPath.append(animate);
        text.append(textPath);
        group.append(text);
        svg.append(group);
      }
      container.append(svg);
      active = svg;
    },
    stop() {
      const svg = active;
      if (!svg) return;
      active = undefined;
      // Fast answers still let the question orbit for a moment before fading.
      lingering = svg;
      lingerTimer = window.setTimeout(
        () => {
          lingering = undefined;
          depart(svg);
        },
        Math.max(0, minimumOrbit - (performance.now() - startedAt)),
      );
    },
  };
}
