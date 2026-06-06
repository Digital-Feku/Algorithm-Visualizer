/*
  Renderer SVG-блок-схемы.
  Структура схемы остается постоянной, а шаг меняет активный узел и переход.
*/

import {
  getNodeAnchorPoint,
  getNodeCenter
} from "../engine/flowchart-geometry.js";
import { escapeHtml } from "./renderer-utils.js";

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
  // Узел получает стабильный id, чтобы шаг мог подсветить его по данным модели.
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

function getDefaultFlowchartEdgeSides(edge, fromNode, toNode) {
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
  // Общий маршрут соединяет ближайшие стороны блоков прямой линией.
  const sides = getDefaultFlowchartEdgeSides(edge, fromNode, toNode);
  const start = getNodeAnchorPoint(fromNode, sides.from);
  const end = getNodeAnchorPoint(toNode, sides.to);

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
  if (edge.labelPoint) {
    return edge.labelPoint;
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

export function renderFlowchart(root, model, step) {
  if (!root) return;

  // При отсутствии схемы оставляем понятную заглушку вместо пустого SVG.
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
