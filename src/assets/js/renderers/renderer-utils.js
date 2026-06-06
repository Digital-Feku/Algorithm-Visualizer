/*
  Общие преобразования для renderer-модулей.
  Экранирование применяется ко всем значениям, попадающим в HTML и SVG.
*/

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function formatValue(value) {
  if (value === undefined || value === null || value === "") {
    return "—";
  }

  return String(value);
}
