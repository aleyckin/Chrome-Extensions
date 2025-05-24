export async function waitForItems() {
    return new Promise(resolve => {
      let tries = 0;
      const interval = setInterval(() => {
        const els = document.querySelectorAll('.inventory_page .itemHolder');
        console.log(`🔍 Попытка ${tries + 1}: Найдено ${els.length} карточек`);
        if (els.length || ++tries > 10) {
          clearInterval(interval);
          resolve(els);
        }
      }, 300);
    });
  }
  
  export async function getSteamID64(url) {
    try {
      const response = await fetch(`https://steamcommunity.com/id/${url}/?xml=1`);
      const xmlText = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, "text/xml");
      return xmlDoc.querySelector('steamID64')?.textContent || null;
    } catch (error) {
      console.error('Ошибка при парсинге:', error);
      return null;
    }
  }
  
  export async function getInventory(steamId, appId, contextId) {
    const inventoryUrl = `https://steamcommunity.com/inventory/${steamId}/${appId}/${contextId}?l=english&count=5000`;
    const inventoryResponse = await fetch(inventoryUrl);
    if (!inventoryResponse.ok) throw new Error('❌ Ошибка загрузки инвентаря');
    return await inventoryResponse.json();
  }
  
  export async function getPrice(url, priceCache) {
    if (priceCache[url]) {
      console.log('💾 Цена найдена в кэше:', priceCache[url]);
      return priceCache[url];
    } else {
      console.log('📡 Обращение к API для получения данных');
      const response = await chrome.runtime.sendMessage({ action: 'getPrice', url });
      if (!response || !response.success) {
        throw new Error(response?.error || "Неизвестная ошибка при получении данных");
      }
      const priceData = response.data;
      priceCache[url] = priceData;
      localStorage.setItem('priceCache', JSON.stringify(priceCache));
      return priceData;
    }
  }
  export async function getItemFloatInfo(marketListingUrl) {
    try {
        // 1. Загружаем страницу
        const response = await fetch(marketListingUrl);
        if (!response.ok) throw new Error('❌ Ошибка загрузки страницы предмета');
        const html = await response.text();
        
        // 2. Парсим HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // 3. Ищем ссылку в .item_actions
        const itemActions = document.querySelector('.item_actions');
        if (!itemActions) throw new Error('❌ Не найден элемент .item_actions');

        // 4. Ищем все ссылки внутри элемента
        const links = itemActions.querySelectorAll('a[href^="steam://rungame"]');
        if (links.length === 0) {
            throw new Error('❌ Не найдены ссылки steam:// в .item_actions');
        }

        // 5. Берем первую найденную ссылку
        const inspectLink = links[0].getAttribute('href');
        if (!inspectLink) {
            throw new Error('❌ Ссылка не содержит атрибут href');
        }

        // 6. Получаем данные о float
        return await fetchFloatData(inspectLink);
        
    } catch (error) {
        console.error('Error in getItemFloatInfo:', error);
        return null;
    }
}

async function fetchFloatData(inspectLink) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      {action: "getFloat", inspectLink},
      (response) => {
        if (response?.iteminfo) {
          resolve({
            float: response.iteminfo.floatvalue,
            seed: response.iteminfo.paintseed
          });
        } else {
          console.error('Float API error:', response?.error);
          resolve(null);
        }
      }
    );
  });
}

  