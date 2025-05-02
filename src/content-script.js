import { waitForItems, getSteamID64, getInventory, getPrice } from './apiUtils.js';
import { createControlPanel, createSortButton, createResetButton, createTypeFilter } from './uiUtils.js';
import { calculateTotalPrice } from './utils.js';

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
      (typeof g_rgProfileData !== 'undefined' && g_rgProfileData.steamid) ||
      window.location.href.match(/\/profiles\/(\d+)/)?.[1] ||
      (typeof g_steamID !== 'undefined' && g_steamID) ||
      await getSteamID64(window.location.href.match(/\/id\/([^\/]+)/)?.[1]) ||
      null;

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

    // Собираем все типы
    const typeMap = new Map();

    for (const holder of holders) {
      const itemDiv = holder.querySelector('.item');
      if (!itemDiv) continue;

      const link = holder.querySelector('a.inventory_item_link');
      const assetKey = link && link.href.startsWith('#')
        ? link.href.slice(link.href.indexOf('#') + 1)
        : itemDiv.id;

      const assetId = assetKey.split('_')[2];
      const descriptionKey = assetMap[assetId];
      const description = descriptionMap[descriptionKey];
      if (!description) continue;

      const type = description.type || 'Other';

      // Добавляем элемент в map с типом
      if (!typeMap.has(type)) {
        typeMap.set(type, []);
      }

      typeMap.get(type).push(holder);

      const marketHashName = encodeURIComponent(description.market_hash_name);
      const priceUrl = `https://steamcommunity.com/market/priceoverview/?currency=1&appid=${appId}&market_hash_name=${marketHashName}`;

      const priceData = await getPrice(priceUrl, priceCache);
      const price = priceData?.lowest_price || 'N/A';

      const priceLabel = document.createElement('div');
      priceLabel.textContent = price;
      Object.assign(priceLabel.style, {
        position: 'absolute',
        bottom: '0',
        left: '0',
        background: 'rgba(0,0,0,0.7)',
        color: '#fff',
        fontSize: '11px',
        padding: '2px 4px',
        zIndex: '9999',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        width: '100%',
        boxSizing: 'border-box'
      });

      holder.style.position = 'relative';
      holder.appendChild(priceLabel);

      const numericPrice = parseFloat(price.replace(/[^0-9.]/g, '')) || 0;
      itemsWithPrices.push({ holder, numericPrice });
    }

    // Создаем панель управления
    const controlPanel = createControlPanel();
    const container = holders[0]?.parentElement;

    let sortCounter = 0;
    const originalOrder = itemsWithPrices.map(item => ({ ...item }));

    createSortButton(controlPanel, itemsWithPrices, container, sortCounter);
    createResetButton(controlPanel, itemsWithPrices, container, originalOrder);

    // Фильтрация по типу
    createTypeFilter(typeMap, controlPanel);

    // Подсчёт общей стоимости
    const totalPrice = calculateTotalPrice(itemsWithPrices);

    const totalPriceDiv = document.createElement('div');
    totalPriceDiv.textContent = `💲 Общая стоимость: $${totalPrice.toFixed(2)}`;
    controlPanel.appendChild(totalPriceDiv);

    console.log('🏁 Интерфейс управления добавлен');
  } catch (err) {
    console.error('❌ Ошибка выполнения content-script:', err);
  }
})();
