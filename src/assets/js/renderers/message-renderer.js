/*
  Renderer короткого пояснения текущего шага.
*/

export function renderMessage(root, step) {
  if (!root) return;
  root.textContent = step?.message ?? "Нет сообщения";
}
