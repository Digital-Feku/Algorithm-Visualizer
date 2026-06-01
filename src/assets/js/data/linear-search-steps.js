// Генератор step timeline для linear search


function createStep({
  kind,
  array,
  target,
  currentIndex = -1,
  checkedIndices = [],
  foundIndex = null,
  result = "pending",
  message = ""
}) {
  const currentValue =
    currentIndex >= 0 && currentIndex < array.length ? array[currentIndex] : null;

  return {
    kind,
    array: [...array],
    target,
    currentIndex,
    currentValue,
    checkedIndices: [...checkedIndices],
    foundIndex,
    result,
    message
  };
}

export function buildLinearSearchSteps(searchConfig = {}) {
  const array = Array.isArray(searchConfig.array) ? searchConfig.array : [];
  const target = searchConfig.target;

  const steps = [
    createStep({
      kind: "start",
      array,
      target,
      currentIndex: -1,
      checkedIndices: [],
      foundIndex: null,
      result: "pending",
      message: `Начинаем линейный поиск числа ${target}.`
    })
  ];

  for (let index = 0; index < array.length; index += 1) {
    const value = array[index];
    const checkedBefore = Array.from({ length: index }, (_, i) => i);

    steps.push(
      createStep({
        kind: "inspect",
        array,
        target,
        currentIndex: index,
        checkedIndices: checkedBefore,
        foundIndex: null,
        result: "pending",
        message: `Проверяем индекс ${index}. Текущее значение: ${value}.`
      })
    );

    if (value === target) {
      steps.push(
        createStep({
          kind: "found",
          array,
          target,
          currentIndex: index,
          checkedIndices: checkedBefore,
          foundIndex: index,
          result: "found",
          message: `Элемент найден: значение ${value} на индексе ${index}.`
        })
      );

      return steps;
    }

    steps.push(
      createStep({
        kind: "checked",
        array,
        target,
        currentIndex: index,
        checkedIndices: [...checkedBefore, index],
        foundIndex: null,
        result: "pending",
        message: `Значение ${value} не равно ${target}. Переходим дальше.`
      })
    );
  }

  steps.push(
    createStep({
      kind: "not-found",
      array,
      target,
      currentIndex: -1,
      checkedIndices: Array.from({ length: array.length }, (_, i) => i),
      foundIndex: null,
      result: "not-found",
      message: `Мы дошли до конца массива. Число ${target} не найдено.`
    })
  );

  return steps;
}