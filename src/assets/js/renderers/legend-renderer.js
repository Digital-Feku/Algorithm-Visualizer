/*
  Renderer номера шага, легенды состояний и журнала выполнения.
*/

import { escapeHtml, formatValue } from "./renderer-utils.js";

export function renderLegend(root, step, meta) {
  if (!root) return;

  root.innerHTML = `
    <div class="legend-grid">
      <div class="legend-card">
        <div class="legend-card__label">Шаг</div>
        <div class="legend-card__value">${meta.stepIndex + 1} / ${meta.totalSteps}</div>
      </div>
      <div class="legend-card">
        <div class="legend-card__label">Статусы</div>
        <div class="legend-swatches">
          <span class="legend-swatch is-idle">Не просмотрен</span>
          <span class="legend-swatch is-visited">Проверен</span>
          <span class="legend-swatch is-current">Текущий</span>
          <span class="legend-swatch is-found">Найден</span>
        </div>
      </div>
      <div class="legend-card legend-card--wide">
        <div class="legend-card__label">Лог шага</div>
        <div class="legend-card__text">${escapeHtml(formatValue(step?.message))}</div>
      </div>
    </div>
  `;
}
