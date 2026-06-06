/*
  Реестр основной визуализации выбирает renderer по ui.primaryVisualization.
  Новый тип представления подключается одной записью в primaryRenderers.
*/

import { renderArrayBars } from "./bars-renderer.js";

const primaryRenderers = new Map([
  ["array-bars", renderArrayBars]
]);

function renderEmptyPrimary(root) {
  root.innerHTML = `
    <div class="runtime-empty">
      Для этого алгоритма пока не настроена основная визуализация.
    </div>
  `;
}

export function renderPrimary(root, model, step) {
  if (!root) return;

  const visualizationType = model?.ui?.primaryVisualization;
  const renderer = primaryRenderers.get(visualizationType);
  const structure = Array.isArray(step?.structures)
    ? step.structures.find((item) => item.type === visualizationType)
    : null;

  if (renderer && structure) {
    renderer(root, model, step, structure);
    return;
  }

  renderEmptyPrimary(root);
}
