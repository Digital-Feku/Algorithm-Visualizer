/*
  Общие геометрические операции для подготовки и отрисовки блок-схемы.
  Один расчёт точек крепления сохраняет совпадение модели и SVG.
*/

export function getNodeCenter(node) {
  return {
    x: node.x + node.width / 2,
    y: node.y + node.height / 2
  };
}

export function getNodeAnchorPoint(node, side) {
  const center = getNodeCenter(node);
  const anchors = {
    top: { x: center.x, y: node.y },
    right: { x: node.x + node.width, y: center.y },
    bottom: { x: center.x, y: node.y + node.height },
    left: { x: node.x, y: center.y }
  };

  return anchors[side] ?? center;
}
