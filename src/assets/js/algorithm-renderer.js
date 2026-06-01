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


function getNodeCenter(node) {
  // Центр нужен для построения линии между двумя блоками схемы.
  return {
    x: node.x + node.width / 2,
    y: node.y + node.height / 2
  };
}

function getFlowchartBounds(nodes) {
  // Размер SVG рассчитывается по узлам, чтобы схема помещалась в рабочую область.
  const minX = nodes.length > 0 ? Math.min(...nodes.map((node) => node.x)) : 0;
  const minY = nodes.length > 0 ? Math.min(...nodes.map((node) => node.y)) : 0;
  const maxX = nodes.length > 0 ? Math.max(...nodes.map((node) => node.x + node.width)) : 0;
  const maxY = nodes.length > 0 ? Math.max(...nodes.map((node) => node.y + node.height)) : 0;
  const padding = 50;

  return {
    x: minX - padding,
    y: minY - padding,
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2
  };
}

function getFlowchartNodeClass(node, step) {
  const isActive = step?.flow?.activeNode === node.id;

  return [
    "flowchart-node",
    `is-${node.type}`,
    isActive ? "is-active" : ""
  ].filter(Boolean).join(" ");
}

function getFlowchartEdgeClass(edge, step) {
  const isActive = step?.flow?.activeEdge === edge.id;

  return [
    "flowchart-edge",
    isActive ? "is-active" : ""
  ].filter(Boolean).join(" ");
}

function getFlowchartLabelLines(label) {
  const text = String(label ?? "");

  if (text.length <= 16) {
    return [text];
  }

  const operatorMatch = text.match(/^(.+?\s[=!<>]=?\s)(.+)$/);

  if (operatorMatch) {
    return [
      operatorMatch[1].trim(),
      operatorMatch[2].trim()
    ];
  }

  return [text];
}

function renderFlowchartNodeLabel(node, x, y) {
  const lines = getFlowchartLabelLines(node.label);
  const lineGap = 22;
  const startY = y - (lines.length - 1) * (lineGap / 2);

  return `
    <text class="flowchart-node__label" x="${x}" y="${startY}">
      ${lines.map((line, index) => `
        <tspan x="${x}" dy="${index === 0 ? 0 : lineGap}">${escapeHtml(line)}</tspan>
      `).join("")}
    </text>
  `;
}

function renderFlowchartNode(node, step) {
  // Узел получает стабильный id в data-атрибуте, чтобы шаг мог подсветить его по YAML.
  const className = getFlowchartNodeClass(node, step);
  const labelX = node.x + node.width / 2;
  const labelY = node.y + node.height / 2;

  if (node.type === "decision") {
    const points = [
      `${labelX},${node.y}`,
      `${node.x + node.width},${labelY}`,
      `${labelX},${node.y + node.height}`,
      `${node.x},${labelY}`
    ].join(" ");

    return `
      <g class="${className}" data-node-id="${escapeHtml(node.id)}">
        <polygon class="flowchart-node__shape" points="${points}"></polygon>
        ${renderFlowchartNodeLabel(node, labelX, labelY)}
      </g>
    `;
  }

  const rx = node.type === "terminal" ? 28 : 10;

  return `
    <g class="${className}" data-node-id="${escapeHtml(node.id)}">
      <rect class="flowchart-node__shape" x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}" rx="${rx}"></rect>
      ${renderFlowchartNodeLabel(node, labelX, labelY)}
    </g>
  `;
}

function getNodeAnchorPoint(node, side) {
  // Стрелки цепляются за край блока, поэтому линия не проходит через подпись.
  const center = getNodeCenter(node);
  const anchors = {
    top: { x: center.x, y: node.y },
    right: { x: node.x + node.width, y: center.y },
    bottom: { x: center.x, y: node.y + node.height },
    left: { x: node.x, y: center.y }
  };

  return anchors[side] ?? center;
}

function getDefaultFlowchartEdgeSides(edge, fromNode, toNode) {
  const edgeKey = `${edge.from}->${edge.to}`;
  const presets = {
    "loop->not-found": { from: "bottom", to: "left" },
    "compare->next": { from: "bottom", to: "top" },
    "next->loop": { from: "top", to: "bottom" }
  };

  if (presets[edgeKey]) {
    return presets[edgeKey];
  }

  if (toNode.x >= fromNode.x + fromNode.width) {
    return { from: "right", to: "left" };
  }

  if (toNode.x + toNode.width <= fromNode.x) {
    return { from: "left", to: "right" };
  }

  return toNode.y >= fromNode.y
    ? { from: "bottom", to: "top" }
    : { from: "top", to: "bottom" };
}

function getDefaultFlowchartEdgePoints(edge, fromNode, toNode) {
  // Для обратных и нижних переходов строим ломаную, чтобы схема читалась как блок-схема.
  const edgeKey = `${edge.from}->${edge.to}`;
  const sides = getDefaultFlowchartEdgeSides(edge, fromNode, toNode);
  const start = getNodeAnchorPoint(fromNode, sides.from);
  const end = getNodeAnchorPoint(toNode, sides.to);

  if (edgeKey === "loop->not-found") {
    return [start, { x: start.x, y: end.y }, end];
  }

  if (edgeKey === "compare->next") {
    const middleX = (start.x + end.x) / 2;
    return start.x === end.x
      ? [start, end]
      : [start, { x: middleX, y: start.y }, { x: middleX, y: end.y }, end];
  }

  if (edgeKey === "next->loop") {
    const bendY = start.y - 48;
    return [start, { x: start.x, y: bendY }, { x: end.x, y: bendY }, end];
  }

  return [start, end];
}

function getFlowchartEdgePoints(edge, fromNode, toNode) {
  if (Array.isArray(edge.points) && edge.points.length > 1) {
    return edge.points;
  }

  return getDefaultFlowchartEdgePoints(edge, fromNode, toNode);
}

function getFlowchartEdgeLabelPoint(edge, points) {
  // Подпись ставим рядом с рабочим участком стрелки, но не поверх стрелки.
  const edgeKey = `${edge.from}->${edge.to}`;

  if (edgeKey === "compare->next") {
    const from = points[0];
    const to = points[points.length - 1] ?? from;

    return {
      x: (from.x + to.x) / 2 + 24,
      y: (from.y + to.y) / 2
    };
  }

  if (edgeKey === "loop->not-found") {
    const from = points[0];
    const to = points[1] ?? from;

    return {
      x: (from.x + to.x) / 2 + 28,
      y: (from.y + to.y) / 2
    };
  }

  if (edgeKey === "next->loop") {
    const from = points[1] ?? points[0];
    const to = points[2] ?? from;

    return {
      x: (from.x + to.x) / 2,
      y: (from.y + to.y) / 2 + 24
    };
  }

  const middleIndex = Math.floor((points.length - 1) / 2);
  const from = points[middleIndex];
  const to = points[middleIndex + 1] ?? from;

  return {
    x: (from.x + to.x) / 2,
    y: (from.y + to.y) / 2 - 22
  };
}

function formatSvgPoints(points) {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

function renderFlowchartEdge(edge, nodesById, step) {
  const fromNode = nodesById.get(edge.from);
  const toNode = nodesById.get(edge.to);

  if (!fromNode || !toNode) {
    return "";
  }

  const points = getFlowchartEdgePoints(edge, fromNode, toNode);
  const labelPoint = getFlowchartEdgeLabelPoint(edge, points);

  return `
    <g class="${getFlowchartEdgeClass(edge, step)}" data-edge-id="${escapeHtml(edge.id)}">
      <polyline class="flowchart-edge__line" points="${formatSvgPoints(points)}" marker-end="url(#flowchart-arrow)"></polyline>
      ${edge.label ? `<text class="flowchart-edge__label" x="${labelPoint.x}" y="${labelPoint.y}">${escapeHtml(edge.label)}</text>` : ""}
    </g>
  `;
}

function buildFlowchart(flowchart, step) {
  const nodes = Array.isArray(flowchart?.nodes) ? flowchart.nodes : [];
  const edges = Array.isArray(flowchart?.edges) ? flowchart.edges : [];
  const bounds = getFlowchartBounds(nodes);
  const nodesById = new Map(nodes.map((node) => [node.id, node]));

  return `
    <svg class="flowchart-svg" viewBox="${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}" role="img" aria-label="Блок-схема алгоритма">
      <defs>
        <marker id="flowchart-arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L0,6 L9,3 z" class="flowchart-arrow"></path>
        </marker>
      </defs>
      <g class="flowchart-svg__edges">
        ${edges.map((edge) => renderFlowchartEdge(edge, nodesById, step)).join("")}
      </g>
      <g class="flowchart-svg__nodes">
        ${nodes.map((node) => renderFlowchartNode(node, step)).join("")}
      </g>
    </svg>
  `;
}

function renderFlowchart(root, model, step) {
  if (!root) return;

  // Если в конфиге нет схемы, оставляем понятную заглушку вместо пустого SVG.
  const hasFlowchart = Array.isArray(model?.flowchart?.nodes) && model.flowchart.nodes.length > 0;

  if (!hasFlowchart) {
    root.innerHTML = `
      <div class="runtime-empty">
        Для этого алгоритма пока не настроена блок-схема.
      </div>
    `;
    return;
  }

  root.innerHTML = buildFlowchart(model.flowchart, step);
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
