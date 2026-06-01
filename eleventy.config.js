const YAML = require("yaml");

module.exports = function (eleventyConfig) {
  eleventyConfig.addDataExtension("yml,yaml", (contents) => YAML.parse(contents));

  eleventyConfig.addPassthroughCopy({
    "src/assets": "assets"
  });

  eleventyConfig.addFilter("dump", (value) => JSON.stringify(value));

  return {
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "_site"
    },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
    templateFormats: ["njk", "md"]
  };
};