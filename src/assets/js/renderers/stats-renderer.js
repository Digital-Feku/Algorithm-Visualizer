/*
  Renderer карточек параметров текущего шага.
*/

import { escapeHtml, formatValue } from "./renderer-utils.js";

function getStatsConfig(model) {
  if (Array.isArray(model?.ui?.stats) && model.ui.stats.length > 0) {
    return model.ui.stats;
  }

  return [
    { key: "target", label: "Target" },
    { key: "index", label: "Index" },
    { key: "value", label: "Value" },
    { key: "result", label: "Result" }
  ];
}

export function renderStats(root, model, step) {
  if (!root) return;

  const statsConfig = getStatsConfig(model);
  const statsMap = step?.stats ?? {};

  root.innerHTML = statsConfig
    .map((item) => {
      const key = item?.key ?? "unknown";
      const label = item?.label ?? key;
      const value = statsMap[key];

      return `
        <div class="runtime-stat-card">
          <div class="runtime-stat-card__label">${escapeHtml(label)}</div>
          <div class="runtime-stat-card__value">${escapeHtml(formatValue(value))}</div>
        </div>
      `;
    })
    .join("");
}
