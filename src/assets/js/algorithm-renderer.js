/*
  Модуль синхронно обновляет области интерфейса для текущего шага.
*/

import { renderFlowchart } from "./renderers/flowchart-renderer.js";
import { renderLegend } from "./renderers/legend-renderer.js";
import { renderMessage } from "./renderers/message-renderer.js";
import { renderPrimary } from "./renderers/primary-renderer.js";
import { renderPseudocode } from "./renderers/pseudocode-renderer.js";
import { renderStats } from "./renderers/stats-renderer.js";

export function createAlgorithmRenderer(roots, model) {
  return {
    renderFrame(step, meta) {
      renderStats(roots.statsRoot, model, step);
      renderPrimary(roots.primaryRoot, model, step);

      // Схему рисуем только в отдельный контейнер, чтобы не стереть текущую область массива.
      if (roots.flowchartRoot !== roots.primaryRoot) {
        renderFlowchart(roots.flowchartRoot, model, step);
      }

      renderPseudocode(roots.pseudocodeRoot, model, step);
      renderLegend(roots.structuresRoot, step, meta);
      renderMessage(roots.messageRoot, step);
    }
  };
}
