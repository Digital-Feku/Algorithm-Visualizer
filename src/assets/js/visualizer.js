/*
  Точка входа клиентского визуализатора.
  Модуль считывает конфигурацию, инициализирует модель, рендерер и плеер,
  а также связывает элементы управления с таймлайном выполнения алгоритма.
*/

import { createAlgorithmModel } from "./algorithm-engine.js";
import { createAlgorithmRenderer } from "./algorithm-renderer.js";
import { createPlayer } from "./core/player.js";

function readAlgorithmConfig() {
  const element = document.getElementById("algorithm-config");

  if (!element) {
    throw new Error("Не найден script#algorithm-config");
  }

  const raw = element.textContent?.trim();

  if (!raw) {
    throw new Error("algorithm-config пустой");
  }

  return JSON.parse(raw);
}

function getRoots() {
  const statsRoot = document.getElementById("runtime-stats");
  const flowchartRoot = document.getElementById("runtime-flowchart");
  const pseudocodeRoot = document.getElementById("runtime-pseudocode");
  const structuresRoot = document.getElementById("runtime-structures");
  const messageRoot = document.getElementById("runtime-message");

  const prevButton = document.querySelector('[data-action="prev"]');
  const nextButton = document.querySelector('[data-action="next"]');
  const togglePlayButton = document.querySelector('[data-action="toggle-play"]');
  const resetButton = document.querySelector('[data-action="reset"]');
  const algorithmSelect = document.getElementById("algorithm-switcher");

  if (!statsRoot || !flowchartRoot || !pseudocodeRoot || !structuresRoot || !messageRoot) {
    throw new Error("Не найдены runtime root-элементы");
  }

  if (!prevButton || !nextButton || !togglePlayButton || !resetButton) {
    throw new Error("Не найдены кнопки управления");
  }

  return {
    statsRoot,
    flowchartRoot,
    pseudocodeRoot,
    structuresRoot,
    messageRoot,
    prevButton,
    nextButton,
    togglePlayButton,
    resetButton,
    algorithmSelect
  };
}

function bindControls(roots, player) {
  roots.prevButton.addEventListener("click", () => {
    player.pause();
    player.prev();
  });

  roots.nextButton.addEventListener("click", () => {
    player.pause();
    player.next();
  });

  roots.togglePlayButton.addEventListener("click", () => {
    player.toggle();
  });

  roots.resetButton.addEventListener("click", () => {
    player.reset();
  });

  if (roots.algorithmSelect) {
    roots.algorithmSelect.addEventListener("change", (event) => {
      const nextValue = event.target.value;
      if (nextValue !== "linear-search") {
        window.alert("Этот алгоритм пока только как заглушка.");
        event.target.value = "linear-search";
      }
    });
  }
}

function syncControls(roots, state) {
  roots.prevButton.disabled = state.isFirst;
  roots.nextButton.disabled = state.isLast;
  roots.togglePlayButton.textContent = state.isPlaying ? "Пауза" : "Play";
}

function start() {
  const config = readAlgorithmConfig();
  const roots = getRoots();

  const model = createAlgorithmModel(config);
  const renderer = createAlgorithmRenderer(roots, model);

  const player = createPlayer({
    steps: model.steps,
    delay: model.ui.autoplayDelay
  });

  player.subscribe((state) => {
    renderer.renderFrame(state.step, {
      stepIndex: state.stepIndex,
      totalSteps: state.totalSteps
    });

    syncControls(roots, state);
  });

  bindControls(roots, player);
}

try {
  start();
} catch (error) {
  console.error(error);

  const messageRoot = document.getElementById("runtime-message");
  if (messageRoot) {
    messageRoot.textContent = "Не удалось запустить визуализатор.";
  }
}
