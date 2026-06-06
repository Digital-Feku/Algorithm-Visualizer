/*
  Renderer строк псевдокода и их состояний.
*/

import { escapeHtml } from "./renderer-utils.js";

export function renderPseudocode(root, model, step) {
  if (!root) return;

  const activeLine = step?.pseudo?.active ?? null;
  const doneLines = Array.isArray(step?.pseudo?.done) ? step.pseudo.done : [];

  root.innerHTML = model.pseudocode
    .map((line, index) => {
      const isActive = line.id === activeLine;
      const isDone = doneLines.includes(line.id);
      const className = [
        "pseudo-line",
        isActive ? "is-active" : "",
        isDone ? "is-done" : "",
        activeLine && !isActive && !isDone ? "is-faded" : ""
      ].filter(Boolean).join(" ");

      return `
        <div class="${className}">
          <div class="pseudo-line__num">${index + 1}</div>
          <pre class="pseudo-line__text"><code>${escapeHtml(line.text)}</code></pre>
        </div>
      `;
    })
    .join("");
}
