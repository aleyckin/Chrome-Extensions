// Проверяем URL и запускаем соответствующий скрипт
if (window.location.href.match(/\/inventory/)) {
  // Импорт для страниц инвентаря
  import('./content-script.js').catch(console.error);
} else if (window.location.href.match(/market\/listings/)) {
  // Импорт для страниц маркета
  import('./market-script.js').catch(console.error);
}