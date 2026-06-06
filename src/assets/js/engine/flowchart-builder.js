/*
  Подготовка блок-схемы: размеры и координаты узлов, переходы и их ссылки.
  YAML хранит смысловую структуру, а этот модуль готовит данные для SVG.
*/

import {
  ensureArray,
  ensureObject,
  validateFlowchartReferences
} from "./validation.js";

function getDefaultNodeSize(node) {
  // Ширина учитывает тип блока и длину подписи, чтобы текст не упирался в рамку.
  const labelLength = String(node?.label ?? "").length;
  const baseWidth = node?.type === "decision" ? 210 : 160;

  return {
    width: Number(node?.width ?? Math.max(baseWidth, labelLength * 12)),
    height: Number(node?.height ?? (node?.type === "decision" ? 92 : 64))
  };
}

function layoutFlowchartNodes(rawNodes, nodePositions) {
  const stepX = 240;
  const stepY = 150;
  const startX = 80;
  const startY = 40;

  return rawNodes.map((node, index) => {
    const id = node?.id ?? `node-${index + 1}`;
    const size = getDefaultNodeSize(node);
    const presetPosition = nodePositions[id] ?? null;

    return {
      id,
      type: node?.type ?? "process",
      label: node?.label ?? "",
      x: Number(node?.x ?? presetPosition?.x ?? startX + (index % 3) * stepX),
      y: Number(node?.y ?? presetPosition?.y ?? startY + Math.floor(index / 3) * stepY),
      width: size.width,
      height: size.height
    };
  });
}

export function normalizeFlowchart(config, nodePositions = {}) {
  if (!config?.flowchart) {
    return { nodes: [], edges: [] };
  }

  const flowchart = ensureObject(config.flowchart, "flowchart");
  const nodes = layoutFlowchartNodes(
    ensureArray(flowchart.nodes ?? [], "flowchart.nodes"),
    nodePositions
  );
  const edges = ensureArray(flowchart.edges ?? [], "flowchart.edges").map((edge, index) => ({
    id: edge?.id ?? `edge-${index + 1}`,
    from: edge?.from,
    to: edge?.to,
    label: edge?.label ?? "",
    // Маршрут задаёт ломаную линию, чтобы стрелка обходила блоки схемы.
    points: Array.isArray(edge?.points)
      ? edge.points.map((point) => ({
          x: Number(point?.x ?? 0),
          y: Number(point?.y ?? 0)
        }))
      : [],
    labelPoint: edge?.labelPoint
      ? {
          x: Number(edge.labelPoint.x ?? 0),
          y: Number(edge.labelPoint.y ?? 0)
        }
      : null
  }));

  validateFlowchartReferences(nodes, edges);

  return { nodes, edges };
}
