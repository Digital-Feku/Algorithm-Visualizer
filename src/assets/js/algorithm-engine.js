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

function validateRequiredSections(config) {
  ["meta", "data", "pseudocode", "flowchart"].forEach((sectionName) => {
    if (!config?.[sectionName]) {
      throw new Error(`В описании алгоритма отсутствует секция ${sectionName}`);
    }
  });
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

function getDefaultNodeSize(node) {
  // Ширина учитывает тип блока и длину подписи, чтобы текст не упирался в рамку.
  const labelLength = String(node?.label ?? "").length;
  const baseWidth = node?.type === "decision" ? 210 : 160;

  return {
    width: Number(node?.width ?? Math.max(baseWidth, labelLength * 12)),
    height: Number(node?.height ?? (node?.type === "decision" ? 92 : 64))
  };
}

function getLinearSearchNodePosition(nodeId) {
  // Раскладка находится в коде визуализатора, YAML хранит смысловую структуру алгоритма.
  const positions = {
    start: { x: 70, y: 150 },
    loop: { x: 280, y: 136 },
    compare: { x: 590, y: 136 },
    found: { x: 900, y: 150 },
    next: { x: 630, y: 315 },
    "not-found": { x: 900, y: 385 }
  };

  return positions[nodeId] ?? null;
}

function layoutFlowchartNodes(rawNodes) {
  const stepX = 240;
  const stepY = 150;
  const startX = 80;
  const startY = 40;

  return rawNodes.map((node, index) => {
    const id = node?.id ?? `node-${index + 1}`;
    const size = getDefaultNodeSize(node);
    const presetPosition = getLinearSearchNodePosition(id);

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

function validateFlowchartReferences(nodes, edges) {
  // Собираем id узлов один раз, чтобы быстро проверить все переходы схемы.
  const nodeIds = new Set(nodes.map((node) => node.id));

  edges.forEach((edge) => {
    if (!nodeIds.has(edge.from)) {
      throw new Error(`Переход ${edge.id} ссылается на неизвестный узел ${edge.from}`);
    }

    if (!nodeIds.has(edge.to)) {
      throw new Error(`Переход ${edge.id} ведет к неизвестному узлу ${edge.to}`);
    }
  });
}

function normalizeFlowchart(config) {
  if (!config?.flowchart) {
    return { nodes: [], edges: [] };
  }

  const flowchart = ensureObject(config.flowchart, "flowchart");
  const nodes = layoutFlowchartNodes(ensureArray(flowchart.nodes ?? [], "flowchart.nodes"));
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
      : []
  }));

  validateFlowchartReferences(nodes, edges);

  return { nodes, edges };
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

    const nextIndex = index + 1;

    steps.push({
      id: `advance-${index}`,
      message: `Значение ${value} не подошло. Увеличиваем индекс до ${nextIndex}.`,
      flow: {
        activeNode: "next",
        activeEdge: findEdgeId(flowchart, "compare", "next")
      },
      pseudo: {
        active: "loop",
        done: ["loop", "compare"]
      },
      stats: {
        target,
        index: nextIndex,
        value: nextIndex < array.length ? array[nextIndex] : null,
        result: "Переход дальше"
      },
      dataState: {
        operation: "Переход",
        active: `i = ${nextIndex}`,
        compare: `${value} !== ${target}`,
        result: "Продолжаем",
        log: `Индекс увеличен до ${nextIndex}.`
      },
      structures: [
        {
          id: "main-array",
          type: "array-bars",
          title: "Массив",
          items: makeArrayItems(array, -1, index)
        }
      ]
    });

    steps.push({
      id: `loop-${nextIndex}`,
      message: nextIndex < array.length
        ? `Возвращаемся к условию цикла для i = ${nextIndex}.`
        : `Индекс ${nextIndex} равен длине массива, цикл завершён.`,
      flow: {
        activeNode: "loop",
        activeEdge: findEdgeId(flowchart, "next", "loop")
      },
      pseudo: {
        active: "loop",
        done: ["compare"]
      },
      stats: {
        target,
        index: nextIndex < array.length ? nextIndex : null,
        value: nextIndex < array.length ? array[nextIndex] : null,
        result: nextIndex < array.length ? "Продолжаем" : "Цикл завершён"
      },
      dataState: {
        operation: "Проверка цикла",
        active: nextIndex < array.length ? `i = ${nextIndex}` : "—",
        compare: `${nextIndex} < ${array.length}`,
        result: nextIndex < array.length ? "true" : "false",
        log: nextIndex < array.length
          ? "Можно продолжать поиск."
          : "Все элементы массива уже проверены."
      },
      structures: [
        {
          id: "main-array",
          type: "array-bars",
          title: "Массив",
          items: makeArrayItems(array, -1, index)
        }
      ]
    });
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

function validateStepReferences(steps, pseudocode, flowchart) {
  // Шаги связывают подсветку псевдокода и схемы, поэтому проверяем их id заранее.
  const lineIds = new Set(pseudocode.map((line) => line.id));
  const nodeIds = new Set(flowchart.nodes.map((node) => node.id));
  const edgeIds = new Set(flowchart.edges.map((edge) => edge.id));

  steps.forEach((step) => {
    if (step.pseudo.active && !lineIds.has(step.pseudo.active)) {
      throw new Error(`Шаг ${step.id} ссылается на неизвестную строку псевдокода ${step.pseudo.active}`);
    }

    step.pseudo.done.forEach((lineId) => {
      if (!lineIds.has(lineId)) {
        throw new Error(`Шаг ${step.id} содержит неизвестную завершенную строку ${lineId}`);
      }
    });

    if (step.flow.activeNode && !nodeIds.has(step.flow.activeNode)) {
      throw new Error(`Шаг ${step.id} ссылается на неизвестный узел схемы ${step.flow.activeNode}`);
    }

    if (step.flow.activeEdge && !edgeIds.has(step.flow.activeEdge)) {
      throw new Error(`Шаг ${step.id} ссылается на неизвестный переход схемы ${step.flow.activeEdge}`);
    }
  });
}

export function createAlgorithmModel(config) {
  validateRequiredSections(config);

  const data = ensureObject(config.data, "data");
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
