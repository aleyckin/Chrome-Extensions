import { waitForItems, getSteamID64, getInventory, getPrice, displayItemFloatInfo } from './apiUtils.js';
import { createControlPanel, createSortButton, createResetButton, createTypeFilter, createResetCacheButton, addFloatToMarketPage} from './uiUtils.js';
import { renderPriceForHolder, renderPricesOnPage, calculateTotalPrice } from './utils.js';

(async () => {
  try {
    console.log('🟢 Скрипт запущен');
    const appId = 730;
    const contextId = 2;

    const holders = await waitForItems();
    if (!holders.length) {
      console.warn('⚠️ Карточки не найдены');
      return;
    }

    const steamId =
      window.location.href.match(/\/profiles\/(\d+)/)?.[1] ||
      (typeof g_steamID !== 'undefined' && g_steamID) ||
      await getSteamID64(window.location.href.match(/\/id\/([^\/]+)/)?.[1]) ||
      null;

    await new Promise((r) => setTimeout(r, 3000))

    const inventory = await getInventory(steamId, appId, contextId);
    if (!inventory) {
      console.warn('⚠️ Ошибка при получении инвентаря');
      return;
    }

    const { assets = [], descriptions = [] } = inventory;

    const assetMap = {};
    assets.forEach(asset => {
      assetMap[asset.assetid] = asset.classid + '_' + asset.instanceid;
    });

    const descriptionMap = {};
    descriptions.forEach(desc => {
      const key = desc.classid + '_' + desc.instanceid;
      descriptionMap[key] = desc;
    });

    const priceCache = JSON.parse(localStorage.getItem('priceCache')) || {};
    const itemsWithPrices = [];
    const typeMap = new Map();

    // 🔄 Выводим цены для всех элементов
    await renderPricesOnPage(document, assetMap, descriptionMap, appId, priceCache, itemsWithPrices, typeMap);

    // 🛠 Панель управления
    const controlPanel = createControlPanel();
    const container = holders[0]?.parentElement;

    let sortCounter = 0;
    const originalOrder = itemsWithPrices.map(item => ({ ...item }));

    createSortButton(controlPanel, itemsWithPrices, container, sortCounter);
    createResetButton(controlPanel, itemsWithPrices, container, originalOrder);
    createResetCacheButton(controlPanel, priceCache);
    createTypeFilter(typeMap, controlPanel);

    // 💲 Общая стоимость
    let totalPrice = calculateTotalPrice(itemsWithPrices);
    const totalPriceDiv = document.createElement('div');
    totalPriceDiv.textContent = ` Общая стоимость: ₽${totalPrice.toFixed(2)}`;
    controlPanel.appendChild(totalPriceDiv);

    console.log('🏁 Интерфейс управления добавлен');

    // 🧠 MutationObserver для подгружаемых страниц
    const containers = document.querySelectorAll('.inventory_ctn');
    for (const container of containers) {
      const observer = new MutationObserver(async mutations => {
        for (const mutation of mutations) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE && node.matches('.inventory_page')) {
              await renderPricesOnPage(node, assetMap, descriptionMap, appId, priceCache, itemsWithPrices, typeMap);
              const updatedTotal = calculateTotalPrice(itemsWithPrices);
              totalPriceDiv.textContent = ` Общая стоимость: ₽${updatedTotal.toFixed(2)}`;
            }
          }
        }
      });

      observer.observe(container, { childList: true });
    }
  } catch (err) {
    console.error('❌ Ошибка выполнения content-script:', err);
  }
})();
