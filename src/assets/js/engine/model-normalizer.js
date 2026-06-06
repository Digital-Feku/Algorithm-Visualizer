/*
  Нормализация приводит разные допустимые варианты YAML к единой модели.
  После этого renderer и player работают с предсказуемой структурой данных.
*/

import { ensureArray } from "./validation.js";

export function normalizeMeta(config) {
  return {
    id: config?.meta?.id ?? "algorithm",
    title: config?.meta?.title ?? "Algorithm",
    description: config?.meta?.description ?? ""
  };
}

export function normalizeUi(config) {
  const rawUi = config?.ui ?? {};
  const rawStats = Array.isArray(rawUi.stats) ? rawUi.stats : [];

  return {
    ...rawUi,
    renderer: rawUi.renderer ?? "algorithm-runtime",
    primaryVisualization: rawUi.primaryVisualization ?? "array-bars",
    primaryTitle: rawUi.primaryTitle ?? "Основная визуализация",
    primaryAriaLabel: rawUi.primaryAriaLabel ?? "Основная визуализация алгоритма",
    stats: rawStats.map((item) => {
      if (typeof item === "string") {
        return {
          key: item,
          label: item.charAt(0).toUpperCase() + item.slice(1)
        };
      }

      return {
        key: item?.key ?? "unknown",
        label: item?.label ?? item?.key ?? "Unknown"
      };
    }),
    autoplayDelay: config?.data?.autoplayDelay ?? 700
  };
}

export function normalizePseudocode(config, defaultLines = []) {
  const raw = config?.pseudocode?.lines ?? config?.pseudocode ?? [];
  const lines = Array.isArray(raw) && raw.length > 0
    ? raw
    : defaultLines;

  return ensureArray(lines, "pseudocode").map((line, index) => {
    if (typeof line === "string") {
      return {
        id: `line-${index + 1}`,
        text: line
      };
    }

    return {
      id: line?.id ?? `line-${index + 1}`,
      text: line?.text ?? ""
    };
  });
}

function normalizeStructures(rawStructures) {
  if (!Array.isArray(rawStructures)) {
    return [];
  }

  return rawStructures.map((structure, index) => ({
    ...structure,
    id: structure?.id ?? `structure-${index + 1}`,
    type: structure?.type ?? "array-bars",
    title: structure?.title ?? "Структура",
    items: Array.isArray(structure?.items) ? structure.items : [],
    nodes: Array.isArray(structure?.nodes) ? structure.nodes : [],
    edges: Array.isArray(structure?.edges) ? structure.edges : []
  }));
}

export function normalizeStep(step, index) {
  const stats = step?.stats ?? {};
  const dataState = step?.dataState ?? {};
  const flow = step?.flow ?? {};
  const pseudo = step?.pseudo ?? {};

  return {
    id: step?.id ?? `step-${index + 1}`,
    message: step?.message ?? "Нет сообщения",
    flow: {
      activeNode: flow?.activeNode ?? null,
      activeEdge: flow?.activeEdge ?? null
    },
    pseudo: {
      active: pseudo?.active ?? null,
      done: Array.isArray(pseudo?.done) ? pseudo.done : []
    },
    stats: {
      ...stats,
      target: stats?.target ?? null,
      index: stats?.index ?? null,
      value: stats?.value ?? null,
      result: stats?.result ?? null
    },
    dataState: {
      ...dataState,
      operation: dataState?.operation ?? "Ожидание",
      active: dataState?.active ?? "—",
      compare: dataState?.compare ?? "—",
      result: dataState?.result ?? "—",
      log: dataState?.log ?? step?.message ?? "—"
    },
    structures: normalizeStructures(step?.structures)
  };
}
