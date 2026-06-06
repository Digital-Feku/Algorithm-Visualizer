/*
  Клиентский обработчик линейного поиска.
  Он превращает исходный массив и target в последовательность состояний.
*/

import { ensureArray, ensureObject } from "../../engine/validation.js";
import { normalizeStep } from "../../engine/model-normalizer.js";

function findEdgeId(flowchart, from, to, fallback = null) {
  return flowchart.edges.find((edge) => edge.from === from && edge.to === to)?.id ?? fallback;
}

export function buildLinearSearchSteps(config, flowchart, makeArrayItems) {
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
