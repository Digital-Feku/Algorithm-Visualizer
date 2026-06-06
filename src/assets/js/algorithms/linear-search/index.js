/*
  Определение линейного поиска собирает его шаги, псевдокод и раскладку схемы.
  Общий движок получает эти зависимости через реестр алгоритмов.
*/

import { prepareLinearSearchFlowchart } from "./linear-search-flowchart.js";
import { buildLinearSearchSteps } from "./linear-search-steps.js";

const defaultPseudocode = [
  { id: "loop", text: "for (let i = 0; i < array.length; i += 1)" },
  { id: "compare", text: "  if (array[i] === target)" },
  { id: "found", text: "    return i;" },
  { id: "return-miss", text: "return -1;" }
];

const nodePositions = {
  start: { x: 70, y: 150 },
  loop: { x: 280, y: 136 },
  compare: { x: 590, y: 136 },
  found: { x: 900, y: 150 },
  next: { x: 630, y: 315 },
  "not-found": { x: 900, y: 385 }
};

export const linearSearchDefinition = {
  type: "linear-search",
  defaultPseudocode,
  nodePositions,
  prepareFlowchart: prepareLinearSearchFlowchart,
  buildSteps: buildLinearSearchSteps
};
