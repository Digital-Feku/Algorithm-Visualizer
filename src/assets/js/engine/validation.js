/*
  Проверки входного YAML и ссылок внутри подготовленной модели.
  Модуль ничего не преобразует и сообщает об ошибках до запуска визуализации.
*/

export function ensureArray(value, fieldName) {
  if (!Array.isArray(value)) {
    throw new Error(`Поле ${fieldName} должно быть массивом`);
  }

  return value;
}

export function ensureObject(value, fieldName) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Поле ${fieldName} должно быть объектом`);
  }

  return value;
}

export function validateRequiredSections(config) {
  ["meta", "data", "pseudocode", "flowchart"].forEach((sectionName) => {
    if (!config?.[sectionName]) {
      throw new Error(`В описании алгоритма отсутствует секция ${sectionName}`);
    }
  });
}

export function validateFlowchartReferences(nodes, edges) {
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

export function validateStepReferences(steps, pseudocode, flowchart) {
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
