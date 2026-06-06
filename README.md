# Algorithm Visualizer

Легковесное web-приложение для пошаговой визуализации алгоритмов. Структура алгоритма хранится в YAML, 11ty и Nunjucks формируют HTML-страницу, а native JavaScript управляет выполнением и синхронно обновляет массив, параметры, псевдокод и SVG-блок-схему.

## Общая архитектура

Работа приложения делится на два этапа.

### 1. Формирование страницы

1. `eleventy.config.js` подключает YAML, Nunjucks и копирование статических файлов.
2. YAML-файлы из `src/_data/algorithms/` загружаются в глобальный объект `algorithms`.
3. `algorithm-pages.11ty.js` создаёт страницу для каждого нового алгоритма по адресу `meta.pageUrl`.
4. Старая страница `linear-search.njk` сохраняет путь Linear Search, описанный в ВКР.
5. `algorithm-demo.njk` получает выбранный алгоритм и помещает его конфигурацию в `script#algorithm-config`.
6. 11ty записывает готовые статические страницы в каталог `_site`.

### 2. Работа в браузере

1. `visualizer.js` считывает JSON из `script#algorithm-config`.
2. `algorithm-engine.js` формирует единую модель алгоритма.
3. `core/player.js` хранит текущий шаг и обрабатывает команды управления.
4. `algorithm-renderer.js` получает состояние player и обновляет все области интерфейса.
5. Внутренние renderer-модули отвечают каждый за свою часть страницы.

Путь данных выглядит так:

```text
algorithm.yaml
        |
        v
algorithm-pages.11ty.js -> algorithm-demo.njk -> base.njk
        |
        v
script#algorithm-config
        |
        v
visualizer.js
        |
        +--> algorithm-engine.js --> algorithms/index.js
        |                               |
        |                               v
        |                         linear-search/
        |                               |
        |                               v
        |                           model.steps
        |
        +--> core/player.js -------> текущее состояние
        |
        +--> algorithm-renderer.js -> DOM и SVG
```

## Структура каталогов

```text
src/
├── _data/
│   └── algorithms/
│       └── linear-search.yaml
├── _includes/
│   └── layouts/
│       ├── base.njk
│       └── algorithm-demo.njk
├── demo/
│   ├── index.njk
│   ├── linear-search.njk
│   └── algorithm-pages.11ty.js
└── assets/
    ├── css/
    │   ├── app.css
    │   ├── tokens.css
    │   ├── base.css
    │   ├── layout.css
    │   ├── components.css
    │   ├── algorithm-runtime.css
    │   └── responsive.css
    └── js/
        ├── visualizer.js
        ├── algorithm-engine.js
        ├── algorithm-renderer.js
        ├── core/
        │   └── player.js
        ├── algorithms/
        │   ├── index.js
        │   └── linear-search/
        │       ├── index.js
        │       ├── linear-search-steps.js
        │       └── linear-search-flowchart.js
        ├── engine/
        │   ├── validation.js
        │   ├── model-normalizer.js
        │   ├── flowchart-geometry.js
        │   └── flowchart-builder.js
        └── renderers/
            ├── renderer-utils.js
            ├── primary-renderer.js
            ├── stats-renderer.js
            ├── bars-renderer.js
            ├── flowchart-renderer.js
            ├── pseudocode-renderer.js
            ├── legend-renderer.js
            └── message-renderer.js
```

## Как работают шаблоны

### `base.njk`

Базовый HTML-каркас. Он задает `doctype`, язык страницы, метаданные, подключает `app.css` и предоставляет блок `content`.

### `algorithm-demo.njk`

Основной layout визуализатора. Он расширяет `base.njk`, получает алгоритм по `algorithmKey`, создает панели интерфейса и подключает `visualizer.js`.

Конфигурация передается клиентскому коду через отдельный JSON-контейнер:

```html
<script type="application/json" id="algorithm-config">
  {{ algorithm | dump | safe }}
</script>
```

### `demo/index.njk`

Формирует главную страницу `/`. Сейчас она показывает демонстрацию линейного поиска.

### `demo/linear-search.njk`

Формирует отдельную страницу демонстрационного алгоритма. Поле `algorithmKey: linear-search` связывает страницу с файлом `linear-search.yaml`.

### `demo/algorithm-pages.11ty.js`

Один общий генератор страниц для новых алгоритмов. Он перебирает объект `algorithms`, берёт адрес из `meta.pageUrl` и передаёт готовый объект в `algorithm-demo.njk`.

В `linear-search.yaml` указано `generatePage: false`, поскольку его страницу уже создаёт утверждённый файл `linear-search.njk`. Для новых YAML это поле можно пропустить.

## JavaScript-модули

### `visualizer.js`

Точка входа клиентской части. Функции `readAlgorithmConfig`, `getRoots`, `bindControls`, `syncControls` и `start` читают конфигурацию, находят DOM-элементы и связывают model, player и renderer.

### `algorithm-engine.js`

Публичный модуль построения модели. Функция `createAlgorithmModel` последовательно проверяет конфигурацию, нормализует псевдокод, подготавливает блок-схему, формирует шаги и проверяет ссылки между частями модели.

Если YAML содержит массив `steps`, движок использует его сразу. Поле `engine.type` и реестр `algorithms/index.js` нужны алгоритмам, которые вычисляют шаги в браузере.

Функция `makeArrayItems` назначает элементам массива состояния `idle`, `visited`, `current` и `found`. Эти функции сохранены в файле, который показан в приложении В ВКР.

### `algorithms/`

Каталог хранит код конкретных алгоритмов. Реестр `algorithms/index.js` связывает значение `engine.type` с определением алгоритма, поэтому общий движок работает через один контракт.

В `algorithms/linear-search/` лежат три связанные части:

- `index.js` описывает тип `linear-search`, запасной псевдокод и координаты узлов;
- `linear-search-steps.js` формирует последовательность шагов поиска;
- `linear-search-flowchart.js` рассчитывает особые маршруты стрелок для этой блок-схемы.

Идентификаторы `loop`, `compare`, `next`, `found` и `not-found` используются только внутри модуля линейного поиска и YAML этого алгоритма. Общие модули движка ничего о них не знают.

### `engine/`

Внутренняя реализация движка:

- `validation.js` проверяет YAML и ссылки между элементами;
- `model-normalizer.js` приводит данные к единому формату;
- `flowchart-geometry.js` одинаково рассчитывает центры и точки крепления стрелок для модели и SVG;
- `flowchart-builder.js` рассчитывает размеры узлов и приводит блок-схему к единому формату.

### `core/player.js`

Управляет номером текущего шага. Методы `next`, `prev`, `play`, `pause`, `toggle` и `reset` меняют состояние, после чего `subscribe` передает новый кадр интерфейсу.

### `algorithm-renderer.js`

Координатор отображения. Функция `createAlgorithmRenderer` возвращает метод `renderFrame`, который обновляет области страницы в установленном порядке.

### `renderers/`

Каждый файл обновляет одну область:

- `stats-renderer.js` выводит карточки параметров;
- `primary-renderer.js` выбирает основную визуализацию по `ui.primaryVisualization`;
- `bars-renderer.js` показывает массив;
- `flowchart-renderer.js` строит SVG-блок-схему;
- `pseudocode-renderer.js` подсвечивает строки псевдокода;
- `legend-renderer.js` выводит номер шага, состояния и журнал;
- `message-renderer.js` показывает пояснение текущего шага;
- `renderer-utils.js` содержит общее форматирование и экранирование HTML.

Отдельные renderer-файлы сохранены намеренно. В `algorithm-renderer.js` виден полный порядок обновления экрана, а имя каждого модуля сразу показывает его область: массив, статистика, схема, псевдокод, легенда или сообщение.

## Связи и ответственность

Структура держится на четырёх правилах:

1. `visualizer.js` только соединяет компоненты и DOM.
2. `algorithm-engine.js` собирает модель, используя общий engine и выбранный модуль алгоритма.
3. `player.js` меняет номер шага и сообщает подписчикам о новом состоянии.
4. `algorithm-renderer.js` отображает готовое состояние и не вычисляет шаги алгоритма.

При нажатии кнопки «Вперёд» цепочка выглядит так:

```text
кнопка -> player.next() -> notify() -> renderFrame()
       -> stats/bars/flowchart/pseudocode/legend/message
```

Renderer получает один и тот же объект шага для всех областей. За счёт этого подсветка массива, строки псевдокода, статистика и блок-схема меняются в одном кадре.

## Как добавить алгоритм

### Простой вариант: один YAML

Для алгоритма с заранее подготовленной демонстрацией создаётся только файл `src/_data/algorithms/example.yaml`. Минимальная схема выглядит так:

```yaml
meta:
  id: example
  title: Новый алгоритм
  menuTitle: Example
  pageUrl: /demo/example/

ui:
  primaryVisualization: array-bars
  primaryTitle: Работа с массивом
  primaryAriaLabel: Массив нового алгоритма
  primaryStats:
    - key: index
      label: Current index
  stats:
    - key: result
      label: Result

data:
  array: [3, 8]

pseudocode:
  lines:
    - id: inspect
      text: inspect item

flowchart:
  nodes: []
  edges: []

steps:
  - id: start
    message: Проверяем первый элемент.
    pseudo:
      active: inspect
      done: []
    stats:
      index: 0
      result: Проверка
    structures:
      - id: main-array
        type: array-bars
        items:
          - index: 0
            value: 3
            state: current
            heightPct: 38
          - index: 1
            value: 8
            state: idle
            heightPct: 100
```

После сборки Eleventy создаст `/demo/example/`, а пункт `Example` появится в списке. Файл страницы, каталог JavaScript и запись в реестре для такого алгоритма не требуются.

### Сложный вариант: YAML и генератор шагов

Отдельный модуль в `src/assets/js/algorithms/` нужен при вводе данных пользователем или вычислении шагов во время запуска. Такой модуль регистрируется в `algorithms/index.js`; Linear Search работает именно по этой схеме.

Показатели шага задаются свободными ключами в `stats`, список верхних карточек хранится в `ui.stats`, а подписи над массивом — в `ui.primaryStats`. Если потребуется новый вид основной визуализации, его renderer регистрируется в `renderers/primary-renderer.js`.

## Соответствие приложениям ВКР

Названия основных файлов и функций сохранены:

- `visualizer.js`: `readAlgorithmConfig`, `getRoots`, `start`;
- `algorithm-engine.js`: `makeArrayItems`, `createAlgorithmModel`;
- `algorithm-renderer.js`: `createAlgorithmRenderer`, `renderFrame`;
- `core/player.js`: механизм пошагового выполнения.

Внутренние каталоги `algorithms`, `engine` и `renderers` раскрывают реализацию этих модулей, сохраняя описанный в ВКР порядок работы и публичные точки входа. `linear-search.yaml`, `linear-search.njk` и клиентский генератор шагов остались на своих местах. Общий `algorithm-pages.11ty.js` обслуживает следующие алгоритмы и не меняет путь Linear Search.

## Запуск

```bash
npm install
npm run dev
```

Статическая сборка:

```bash
npm run build
```
