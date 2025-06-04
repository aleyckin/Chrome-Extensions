import { waitForItems, getSteamID64, getInventory, getPrice, displayItemFloatInfo, displayMargin } from './apiUtils.js';
import { createControlPanel, createSortButton, createResetButton, createTypeFilter, createResetCacheButton, addFloatToMarketPage} from './uiUtils.js';
import { renderPriceForHolder, renderPricesOnPage, calculateTotalPrice } from './utils.js';

(async () => {
  try {
    console.log('🟢 Маркет Скрипт запущен');
    const appId = 730;
    const contextId = 2;

    addFloatToMarketPage();

    await new Promise((r) => setTimeout(r, 1000))
    displayMargin();


  } catch (err) {
    console.error('❌ Ошибка выполнения market-script:', err);
  }
})();
