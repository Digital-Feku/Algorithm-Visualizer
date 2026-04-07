/*
  Модуль отвечает за отрисовку текущего состояния алгоритма в интерфейсе:
  статистика, основная визуализация, псевдокод, легенда и сообщение шага.
*/

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatValue(value) {
  if (value === undefined || value === null || value === "") {
    return "—";
  }

  return String(value);
}

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

function renderStats(root, model, step) {
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

function renderArrayBars(structure, step) {
  const items = Array.isArray(structure?.items) ? structure.items : [];
  const activeIndex = step?.stats?.index;
  const target = step?.stats?.target;

  return `
    <div class="array-stage">
      <div class="array-stage__meta">
        <div class="array-stage__pill">Array length: ${items.length}</div>
        <div class="array-stage__pill">Target: ${escapeHtml(formatValue(target))}</div>
        <div class="array-stage__pill">Current index: ${escapeHtml(formatValue(activeIndex))}</div>
      </div>

      <div class="array-bars" role="img" aria-label="Массив столбцов для линейного поиска">
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

function renderEmptyPrimary(root) {
  if (!root) return;

  root.innerHTML = `
    <div class="runtime-empty">
      Для этого алгоритма пока не настроена основная визуализация.
    </div>
  `;
}

function renderPrimary(root, model, step) {
  if (!root) return;

  const mainStructure = Array.isArray(step?.structures)
    ? step.structures.find((item) => item.type === "array-bars")
    : null;

  if (model?.ui?.primaryVisualization === "array-bars" && mainStructure) {
    root.innerHTML = renderArrayBars(mainStructure, step);
    return;
  }

  renderEmptyPrimary(root);
}

function renderPseudocode(root, model, step) {
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

function renderLegend(root, step, meta) {
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

function renderMessage(root, step) {
  if (!root) return;
  root.textContent = step?.message ?? "Нет сообщения";
}

export function createAlgorithmRenderer(roots, model) {
  return {
    renderFrame(step, meta) {
      renderStats(roots.statsRoot, model, step);
      renderPrimary(roots.flowchartRoot, model, step);
      renderPseudocode(roots.pseudocodeRoot, model, step);
      renderLegend(roots.structuresRoot, step, meta);
      renderMessage(roots.messageRoot, step);
    }
  };
}
