// Универсальный renderer для массива-столбцов


function hasCheckedIndex(step, index) {
  return Array.isArray(step.checkedIndices) && step.checkedIndices.includes(index);
}

export function renderBars(container, step) {
  if (!container) return;

  const array = Array.isArray(step?.array) ? step.array : [];

  container.innerHTML = "";

  if (array.length === 0) {
    container.innerHTML = `<div class="search-demo__empty">Нет данных для визуализации.</div>`;
    return;
  }

  const maxValue = Math.max(...array, 1);

  array.forEach((value, index) => {
    const item = document.createElement("div");
    item.className = "bar-item";

    const valueLabel = document.createElement("div");
    valueLabel.className = "bar-value";
    valueLabel.textContent = String(value);

    const wrap = document.createElement("div");
    wrap.className = "bar-column-wrap";

    const bar = document.createElement("div");
    bar.className = "bar-column";
    bar.style.height = `${Math.max(36, (value / maxValue) * 240)}px`;
    bar.dataset.index = String(index);
    bar.dataset.value = String(value);
    bar.setAttribute("aria-label", `Элемент массива ${value} на индексе ${index}`);

    if (hasCheckedIndex(step, index)) {
      bar.classList.add("is-checked");
    }

    if (step.currentIndex === index) {
      bar.classList.add("is-current");
    }

    if (step.foundIndex === index) {
      bar.classList.remove("is-current");
      bar.classList.add("is-found");
    }

    const indexLabel = document.createElement("div");
    indexLabel.className = "bar-index";
    indexLabel.textContent = `i = ${index}`;

    wrap.appendChild(bar);
    item.appendChild(valueLabel);
    item.appendChild(wrap);
    item.appendChild(indexLabel);

    container.appendChild(item);
  });
}