/*
  Общий генератор страниц для алгоритмов, описанных готовыми steps в YAML.
*/

module.exports = class AlgorithmPages {
  data() {
    return {
      layout: "layouts/algorithm-demo.njk",
      pagination: {
        data: "algorithms",
        size: 1,
        resolve: "values",
        alias: "algorithmPage",
        before(algorithms) {
          return algorithms.filter((algorithm) => algorithm?.meta?.generatePage !== false);
        }
      },
      eleventyComputed: {
        permalink(data) {
          const pageUrl = data?.algorithmPage?.meta?.pageUrl;

          if (!pageUrl) {
            throw new Error("Для автоматической страницы укажи meta.pageUrl в YAML алгоритма");
          }

          return pageUrl;
        },
        title(data) {
          return data?.algorithmPage?.meta?.menuTitle
            ?? data?.algorithmPage?.meta?.title
            ?? "Алгоритм";
        }
      }
    };
  }

  render() {
    // Содержимое интерфейса формирует общий layout algorithm-demo.njk.
    return "";
  }
};
