// Renderer для stats/message панели


function updateText(element, value) {
  if (!element) return;
  element.textContent = value;
}

function getResultLabel(step) {
  if (!step) {
    return "Нет данных";
  }

  if (step.kind === "found") {
    return `Найдено на индексе ${step.foundIndex}`;
  }

  if (step.kind === "not-found") {
    return "Не найдено";
  }

  if (step.kind === "start") {
    return "Ожидание";
  }

  return "Идёт поиск";
}

function getCurrentValue(step) {
  if (!step || step.currentIndex < 0 || step.currentValue == null) {
    return "—";
  }

  return String(step.currentValue);
}

export function renderStats(statsRoot, messageRoot, step, algorithm) {
  const targetEl = statsRoot?.querySelector("#stat-target");
  const indexEl = statsRoot?.querySelector("#stat-index");
  const valueEl = statsRoot?.querySelector("#stat-value");
  const resultEl = statsRoot?.querySelector("#stat-result");

  updateText(targetEl, String(algorithm?.search?.target ?? "—"));
  updateText(indexEl, step?.currentIndex >= 0 ? String(step.currentIndex) : "—");
  updateText(valueEl, getCurrentValue(step));
  updateText(resultEl, getResultLabel(step));
  updateText(messageRoot, step?.message ?? "Нет сообщения");
}