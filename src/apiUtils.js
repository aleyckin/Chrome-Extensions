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

  