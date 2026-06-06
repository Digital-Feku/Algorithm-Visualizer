/*
  Renderer основной области данных для представления array-bars.
*/

import { escapeHtml, formatValue } from "./renderer-utils.js";

function renderPrimaryStats(model, step, items) {
  const statsConfig = Array.isArray(model?.ui?.primaryStats)
    ? model.ui.primaryStats
    : [];
  const values = {
    length: items.length,
    ...model?.data,
    ...step?.stats
  };

  if (statsConfig.length === 0) {
    return "";
  }

  return `
    <div class="array-stage__meta">
      ${statsConfig.map((item) => `
        <div class="array-stage__pill">
          ${escapeHtml(item?.label ?? item?.key)}:
          ${escapeHtml(formatValue(values[item?.key]))}
        </div>
      `).join("")}
    </div>
  `;
}

function buildArrayBars(structure, model, step, ariaLabel) {
  const items = Array.isArray(structure?.items) ? structure.items : [];

  return `
    <div class="array-stage">
      ${renderPrimaryStats(model, step, items)}

      <div class="array-bars" role="img" aria-label="${escapeHtml(ariaLabel)}">
        ${items.map((item) => {
          const state = item?.state ?? "idle";
          const height = Number(item?.heightPct ?? 20);

          return `
            <div class="array-bars__item is-${escapeHtml(state)}">
              <div class="array-bars__value">${escapeHtml(formatValue(item?.value))}</div>
              <div class="array-bars__track">
                <div class="array-bars__bar" style="height:${height}%"></div>
              </div>
              <div class="array-bars__index">${escapeHtml(formatValue(item?.index))}</div>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

export function renderArrayBars(root, model, step, structure) {
  if (!root) return;

  const ariaLabel = model?.ui?.primaryAriaLabel ?? "Массив столбцов алгоритма";
  root.innerHTML = buildArrayBars(structure, model, step, ariaLabel);
}
