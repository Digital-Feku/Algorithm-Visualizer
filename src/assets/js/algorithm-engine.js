/*
  Модуль формирует единую модель алгоритма на основе YAML-конфигурации:
  выполняет валидацию, нормализацию и построение последовательности шагов.
*/

function ensureArray(value, fieldName) {
  if (!Array.isArray(value)) {
    throw new Error(`Поле ${fieldName} должно быть массивом`);
  }

  return value;
}

function ensureObject(value, fieldName) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Поле ${fieldName} должно быть объектом`);
  }

  return value;
}

function normalizeMeta(config) {
  return {
    id: config?.meta?.id ?? "algorithm",
    title: config?.meta?.title ?? "Algorithm",
    description: config?.meta?.description ?? ""
  };
}

function normalizeUi(config) {
  const rawStats = Array.isArray(config?.ui?.stats) ? config.ui.stats : [];

  return {
    renderer: config?.ui?.renderer ?? "algorithm-runtime",
    primaryVisualization: config?.ui?.primaryVisualization ?? "array-bars",
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

function getDefaultJavascriptLines(engineType) {
  if (engineType === "linear-search") {
    return [
      { id: "loop", text: "for (let i = 0; i < array.length; i += 1)" },
      { id: "compare", text: "  if (array[i] === target)" },
      { id: "found", text: "    return i;" },
      { id: "return-miss", text: "return -1;" }
    ];
  }

  return [];
}

function normalizePseudocode(config) {
  const raw = config?.pseudocode?.lines ?? config?.pseudocode ?? [];
  const lines = Array.isArray(raw) && raw.length > 0
    ? raw
    : getDefaultJavascriptLines(config?.engine?.type);

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

function layoutFlowchartNodes(rawNodes) {
  const stepX = 240;
  const stepY = 150;
  const startX = 80;
  const startY = 40;

  return rawNodes.map((node, index) => ({
    id: node?.id ?? `node-${index + 1}`,
    type: node?.type ?? "process",
    label: node?.label ?? "",
    x: Number(node?.x ?? startX + (index % 3) * stepX),
    y: Number(node?.y ?? startY + Math.floor(index / 3) * stepY),
    width: Number(node?.width ?? (node?.type === "decision" ? 180 : 160)),
    height: Number(node?.height ?? (node?.type === "decision" ? 90 : 64))
  }));
}

function normalizeFlowchart(config) {
  if (!config?.flowchart) {
    return { nodes: [], edges: [] };
  }

  const flowchart = ensureObject(config.flowchart, "flowchart");
  const nodes = ensureArray(flowchart.nodes ?? [], "flowchart.nodes");
  const edges = ensureArray(flowchart.edges ?? [], "flowchart.edges");

  return {
    nodes: layoutFlowchartNodes(nodes),
    edges: edges.map((edge, index) => ({
      id: edge?.id ?? `edge-${index + 1}`,
      from: edge?.from,
      to: edge?.to,
      label: edge?.label ?? ""
    }))
  };
}

function normalizeStructures(rawStructures) {
  if (!Array.isArray(rawStructures)) {
    return [];
  }

  return rawStructures.map((structure, index) => ({
    id: structure?.id ?? `structure-${index + 1}`,
    type: structure?.type ?? "array-bars",
    title: structure?.title ?? "Структура",
    items: Array.isArray(structure?.items) ? structure.items : [],
    nodes: Array.isArray(structure?.nodes) ? structure.nodes : [],
    edges: Array.isArray(structure?.edges) ? structure.edges : []
  }));
}

function normalizeStep(step, index) {
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
      target: stats?.target ?? null,
      index: stats?.index ?? null,
      value: stats?.value ?? null,
      result: stats?.result ?? null
    },
    dataState: {
      operation: dataState?.operation ?? "Ожидание",
      active: dataState?.active ?? "—",
      compare: dataState?.compare ?? "—",
      result: dataState?.result ?? "—",
      log: dataState?.log ?? step?.message ?? "—"
    },
    structures: normalizeStructures(step?.structures)
  };
}

function findEdgeId(flowchart, from, to, fallback = null) {
  return flowchart.edges.find((edge) => edge.from === from && edge.to === to)?.id ?? fallback;
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

function buildLinearSearchSteps(config, flowchart) {
  const data = ensureObject(config?.data ?? {}, "data");
  const array = ensureArray(data.array ?? [], "data.array");
  const target = data.target;

  const steps = [];

  steps.push({
    id: "start",
    message: `Начинаем линейный поиск числа ${target}.`,
    flow: {
      activeNode: "start",
      activeEdge: findEdgeId(flowchart, "start", "loop")
    },
    pseudo: {
      active: "loop",
      done: []
    },
    stats: {
      target,
      index: null,
      value: null,
      result: "Ожидание"
    },
    dataState: {
      operation: "Инициализация",
      active: "—",
      compare: "—",
      result: "Ожидание",
      log: `Подготовили массив и target = ${target}.`
    },
    structures: [
      {
        id: "main-array",
        type: "array-bars",
        title: "Массив",
        items: makeArrayItems(array, -1, -1)
      }
    ]
  });

  for (let index = 0; index < array.length; index += 1) {
    const value = array[index];

    steps.push({
      id: `inspect-${index}`,
      message: `Проверяем индекс ${index}: сравниваем ${value} с ${target}.`,
      flow: {
        activeNode: "compare",
        activeEdge: findEdgeId(flowchart, "loop", "compare")
      },
      pseudo: {
        active: "compare",
        done: ["loop"]
      },
      stats: {
        target,
        index,
        value,
        result: value === target ? "true" : "false"
      },
      dataState: {
        operation: "Сравнение",
        active: `i = ${index}`,
        compare: `${value} === ${target}`,
        result: value === target ? "true" : "false",
        log: value === target
          ? `Условие сработало, нашли ${target}.`
          : `Элемент ${value} не равен ${target}.`
      },
      structures: [
        {
          id: "main-array",
          type: "array-bars",
          title: "Массив",
          items: makeArrayItems(array, index, index - 1)
        }
      ]
    });

    if (value === target) {
      steps.push({
        id: `found-${index}`,
        message: `Элемент найден. Возвращаем индекс ${index}.`,
        flow: {
          activeNode: "found",
          activeEdge: findEdgeId(flowchart, "compare", "found")
        },
        pseudo: {
          active: "found",
          done: ["loop", "compare"]
        },
        stats: {
          target,
          index,
          value,
          result: `Найдено на индексе ${index}`
        },
        dataState: {
          operation: "Завершение",
          active: `i = ${index}`,
          compare: `${value} === ${target}`,
          result: `Найдено на индексе ${index}`,
          log: "Алгоритм завершён успешно."
        },
        structures: [
          {
            id: "main-array",
            type: "array-bars",
            title: "Массив",
            items: makeArrayItems(array, -1, index - 1, index)
          }
        ]
      });

      return steps.map(normalizeStep);
    }
  }

  steps.push({
    id: "not-found",
    message: `Мы дошли до конца массива. Число ${target} не найдено.`,
    flow: {
      activeNode: "not-found",
      activeEdge: findEdgeId(flowchart, "loop", "not-found")
    },
    pseudo: {
      active: "return-miss",
      done: ["loop", "compare"]
    },
    stats: {
      target,
      index: null,
      value: null,
      result: "Не найдено"
    },
    dataState: {
      operation: "Завершение",
      active: "—",
      compare: "—",
      result: "Не найдено",
      log: `Проверили весь массив, но значение ${target} не встретилось.`
    },
    structures: [
      {
        id: "main-array",
        type: "array-bars",
        title: "Массив",
        items: makeArrayItems(array, -1, array.length - 1)
      }
    ]
  });

  return steps.map(normalizeStep);
}

function buildSteps(config, flowchart) {
  if (Array.isArray(config?.steps) && config.steps.length > 0) {
    return config.steps.map(normalizeStep);
  }

  const engineType = config?.engine?.type;

  if (engineType === "linear-search") {
    return buildLinearSearchSteps(config, flowchart);
  }

  throw new Error(`Не умею автоматически генерировать steps для engine.type = ${engineType}`);
}

export function createAlgorithmModel(config) {
  const data = ensureObject(config?.data ?? {}, "data");
  const flowchart = normalizeFlowchart(config);

  return {
    meta: normalizeMeta(config),
    ui: normalizeUi(config),
    data,
    pseudocode: normalizePseudocode(config),
    flowchart,
    steps: buildSteps(config, flowchart)
  };
}

