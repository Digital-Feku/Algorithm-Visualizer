/*
  Реестр связывает значение engine.type из YAML с модулем алгоритма.
  Для добавления алгоритма достаточно зарегистрировать еще одно определение.
*/

import { linearSearchDefinition } from "./linear-search/index.js";

const definitions = new Map([
  [linearSearchDefinition.type, linearSearchDefinition]
]);

export function getAlgorithmDefinition(engineType) {
  return definitions.get(engineType) ?? null;
}
