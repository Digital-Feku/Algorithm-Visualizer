# Algorithm Visualizer
Визуализатор алгоритмов, описание алгоритма задается в YAML, на выходе получается интерактивная демонстрация выполнения.


- блок-схема с подсветкой активного шага;
- синхронный просмотр псевдокода (как в debugger);
- отображение состояния данных на каждом шаге.


## Принцип работы

1. Пишется YAML-конфиг алгоритма (`src/_data/algorithms/*.yaml`)
2. На его основе собирается модель алгоритма в JavaScript (`src/assets/js/algorithm-engine.js`)
3. Рендерер отображает:
   - шаг алгоритма
   - псевдокод с подсветкой
   - состояние структур данных
4. Плеер управляет таймлайном шагов (`prev/next/play/reset`)

## Что за что отвечает

- `src/_data/algorithms/` - YAML-описания алгоритмов
- `src/assets/js/algorithm-engine.js` - нормализация YAML и построение шагов выполнения
- `src/assets/js/algorithm-renderer.js` - отрисовка UI для текущего шага
- `src/assets/js/core/player.js` - пошаговый проигрыватель
- `src/demo/*.njk` - страницы демо
- `src/_includes/layouts/algorithm-demo.njk` - основной layout визуализатора

## Быстрый старт

```bash
npm install
npm run dev
```

Сборка статического сайта:

```bash
npm run build
```

