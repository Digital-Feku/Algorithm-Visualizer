/*
  Геометрия переходов относится к конкретной схеме линейного поиска.
  Renderer получает готовые точки и остается общим для других алгоритмов.
*/

import { getNodeAnchorPoint } from "../../engine/flowchart-geometry.js";

function getEdgeNodes(edge, nodesById) {
  return {
    fromNode: nodesById.get(edge.from),
    toNode: nodesById.get(edge.to)
  };
}

function buildLoopToNotFound(edge, nodesById) {
  const { fromNode, toNode } = getEdgeNodes(edge, nodesById);

  if (!fromNode || !toNode) return null;

  const start = getNodeAnchorPoint(fromNode, "bottom");
  const end = getNodeAnchorPoint(toNode, "left");
  const points = [start, { x: start.x, y: end.y }, end];

  return {
    points,
    labelPoint: {
      x: (points[0].x + points[1].x) / 2 + 28,
      y: (points[0].y + points[1].y) / 2
    }
  };
}

function buildCompareToNext(edge, nodesById) {
  const { fromNode, toNode } = getEdgeNodes(edge, nodesById);

  if (!fromNode || !toNode) return null;

  const start = getNodeAnchorPoint(fromNode, "bottom");
  const end = getNodeAnchorPoint(toNode, "top");
  const middleX = (start.x + end.x) / 2;
  const points = start.x === end.x
    ? [start, end]
    : [start, { x: middleX, y: start.y }, { x: middleX, y: end.y }, end];

  return {
    points,
    labelPoint: {
      x: (start.x + end.x) / 2 + 24,
      y: (start.y + end.y) / 2
    }
  };
}

function buildNextToLoop(edge, nodesById) {
  const { fromNode, toNode } = getEdgeNodes(edge, nodesById);

  if (!fromNode || !toNode) return null;

  const start = getNodeAnchorPoint(fromNode, "top");
  const end = getNodeAnchorPoint(toNode, "bottom");
  const bendY = start.y - 48;
  const points = [start, { x: start.x, y: bendY }, { x: end.x, y: bendY }, end];

  return {
    points,
    labelPoint: {
      x: (points[1].x + points[2].x) / 2,
      y: (points[1].y + points[2].y) / 2 + 24
    }
  };
}

const routeBuilders = new Map([
  ["loop->not-found", buildLoopToNotFound],
  ["compare->next", buildCompareToNext],
  ["next->loop", buildNextToLoop]
]);

export function prepareLinearSearchFlowchart(flowchart) {
  const nodesById = new Map(flowchart.nodes.map((node) => [node.id, node]));
  const edges = flowchart.edges.map((edge) => {
    const routeBuilder = routeBuilders.get(`${edge.from}->${edge.to}`);
    const route = routeBuilder?.(edge, nodesById);

    return route ? { ...edge, ...route } : edge;
  });

  return {
    ...flowchart,
    edges
  };
}
