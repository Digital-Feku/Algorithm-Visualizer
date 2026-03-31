// Основной объединяющий файл

import { buildLinearSearchSteps } from "./data/linear-search-steps.js";
import { renderBars } from "./renderers/bars-renderer.js";
import { renderStats } from "./renderers/stats-renderer.js";
import { createPlayer } from "./core/player.js";

function readAlgorithmConfig() {
  const configElement = document.getElementById("algorithm-config");

  if (!configElement) {
    throw new Error("Не найден script#algorithm-config");
  }

  const raw = configElement.textContent?.trim();

  if (!raw) {
    throw new Error("algorithm-config пустой");
  }

  return JSON.parse(raw);
}

function getRequiredElements() {
  const statsRoot = document.getElementById("stats-root");
  const chartRoot = document.getElementById("chart-root");
  const messageRoot = document.getElementById("message-root");

  const prevButton = document.querySelector('[data-action="prev"]');
  const nextButton = document.querySelector('[data-action="next"]');
  const togglePlayButton = document.querySelector('[data-action="toggle-play"]');
  const resetButton = document.querySelector('[data-action="reset"]');

  if (!statsRoot) {
    throw new Error("Не найден #stats-root");
  }

  if (!chartRoot) {
    throw new Error("Не найден #chart-root");
  }

  if (!messageRoot) {
    throw new Error("Не найден #message-root");
  }

  if (!prevButton || !nextButton || !togglePlayButton || !resetButton) {
    throw new Error("Не найдены кнопки управления visualizer");
  }

  return {
    statsRoot,
    chartRoot,
    messageRoot,
    prevButton,
    nextButton,
    togglePlayButton,
    resetButton
  };
}

function renderPlayerState(elements, state, algorithm) {
  const {
    statsRoot,
    chartRoot,
    messageRoot,
    prevButton,
    nextButton,
    togglePlayButton
  } = elements;

  renderBars(chartRoot, state.step);
  renderStats(statsRoot, messageRoot, state.step, algorithm);

  prevButton.disabled = state.isFirst;
  nextButton.disabled = state.isLast;
  togglePlayButton.textContent = state.isPlaying ? "Pause" : "Play";
}

function bindControls(elements, player) {
  const {
    prevButton,
    nextButton,
    togglePlayButton,
    resetButton
  } = elements;

  prevButton.addEventListener("click", () => {
    player.pause();
    player.prev();
  });

  nextButton.addEventListener("click", () => {
    player.pause();
    player.next();
  });

  togglePlayButton.addEventListener("click", () => {
    player.toggle();
  });

  resetButton.addEventListener("click", () => {
    player.reset();
  });
}

function startVisualizer() {
  const algorithm = readAlgorithmConfig();
  const elements = getRequiredElements();

  if (!algorithm?.search || !Array.isArray(algorithm.search.array)) {
    throw new Error("Некорректный algorithm.search config");
  }

  const steps = buildLinearSearchSteps(algorithm.search);

  const player = createPlayer({
    steps,
    delay: algorithm.search.autoplayDelay ?? 700
  });

  player.subscribe((state) => {
    renderPlayerState(elements, state, algorithm);
  });

  bindControls(elements, player);
}

try {
  startVisualizer();
} catch (error) {
  console.error(error);

  const messageRoot = document.getElementById("message-root");
  if (messageRoot) {
    messageRoot.textContent = "Не удалось запустить визуализатор.";
  }
}