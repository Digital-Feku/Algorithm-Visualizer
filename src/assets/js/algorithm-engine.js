/*
  Модуль формирует единую модель алгоритма на основе YAML-конфигурации.
*/

import { getAlgorithmDefinition } from "./algorithms/index.js";
import { normalizeFlowchart as normalizeFlowchartModel } from "./engine/flowchart-builder.js";
import {
  normalizeMeta,
  normalizePseudocode as normalizePseudocodeModel,
  normalizeStep,
  normalizeUi
} from "./engine/model-normalizer.js";
import {
  ensureObject,
  validateRequiredSections,
  validateStepReferences
} from "./engine/validation.js";

function getDefinition(config) {
  return getAlgorithmDefinition(config?.engine?.type);
}

function normalizePseudocode(config) {
  const definition = getDefinition(config);

  return normalizePseudocodeModel(config, definition?.defaultPseudocode ?? []);
}

function normalizeFlowchart(config) {
  const definition = getDefinition(config);
  const flowchart = normalizeFlowchartModel(config, definition?.nodePositions ?? {});

  return definition?.prepareFlowchart
    ? definition.prepareFlowchart(flowchart)
    : flowchart;
}

function buildSteps(config, flowchart) {
  if (Array.isArray(config?.steps) && config.steps.length > 0) {
    return config.steps.map(normalizeStep);
  }

  const engineType = config?.engine?.type;
  const definition = getDefinition(config);

  if (definition?.buildSteps) {
    return definition.buildSteps(config, flowchart, makeArrayItems);
  }

  throw new Error(`Не умею автоматически генерировать steps для engine.type = ${engineType}`);
}

function makeArrayItems(array, currentIndex, visitedUntil, foundIndex = -1) {
  const maxValue = Math.max(...array, 1);

  return array.map((value, index) => {
    let state = "idle";

    if (index <= visitedUntil && visitedUntil >= 0) {
      state = "visited";
    }

    if (index === currentIndex) {
      state = "current";
    }

    if (index === foundIndex) {
      state = "found";
    }

    return {
      index,
      value,
      label: String(value),
      state,
      heightPct: Math.max(18, Math.round((value / maxValue) * 100))
    };
  });
}

export function createAlgorithmModel(config) {
  validateRequiredSections(config);

  const data = ensureObject(config?.data ?? {}, "data");
  const pseudocode = normalizePseudocode(config);
  const flowchart = normalizeFlowchart(config);
  const steps = buildSteps(config, flowchart);

  validateStepReferences(steps, pseudocode, flowchart);

  return {
    meta: normalizeMeta(config),
    ui: normalizeUi(config),
    data,
    pseudocode,
    flowchart,
    steps
  };
}
