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
  const inventoryUrl = `https://steamcommunity.com/inventory/${steamId}/${appId}/${contextId}?l=english&count=1000`;
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


export async function displayMargin() {
  
  const priceText = document.querySelectorAll(".market_commodity_orders_header_promote")[1].innerHTML
  const priceMatch = priceText.match(/(\d+[\.,]\d{2})|(\d+)/);
  const autobuyPrice = parseFloat(priceMatch[0].replace(',', '.'));
  const items = document.querySelectorAll('#searchResultsRows > .market_listing_row');
  for (const index in items) {
      const item = items[index]
      const itemPriceText = item.querySelector(".market_listing_price_with_fee").innerHTML
      const buyMatch = itemPriceText.match(/(\d+[\.,]\d{2})|(\d+)/);
      const containerPrice = parseFloat(buyMatch[0].replace(',', '.'));
      const margin = containerPrice - autobuyPrice
      const percentage = margin/autobuyPrice*100
      
      const marginElement = document.createElement('div');
        marginElement.className = 'margin';
        marginElement.style.cssText = `
          position: absolute;
          bottom: 5px;
          left: 300px;
          color: white;
          padding: 2px 5px;
          font-size: 11px;
          border-radius: 3px;
          z-index: 10;
        `;
        marginElement.innerHTML = `
          Маржа: ${margin.toFixed(2)} | Процент: ${percentage.toFixed(2)}
        `;

         item.style.position = 'relative';
        item.appendChild(marginElement);
  }
  
}


export async function displayItemFloatInfo(marketListingUrl) {
  try {

    const response = await fetch(marketListingUrl);
    if (!response.ok) throw new Error('❌ Ошибка загрузки страницы предмета');
    const html = await response.text();


    const items = document.querySelectorAll('#searchResultsRows > .market_listing_row');
    if (!items.length) throw new Error('❌ Не найдены предметы на странице');

    // 4. Обрабатываем каждый предмет
    for (const item of items) {
      try {

        const inspectLinkElement = item.querySelector('a[href^="steam://rungame"]');
        if (!inspectLinkElement) continue;

        const inspectLink = inspectLinkElement.getAttribute('href');
        if (!inspectLink) continue;


        const floatData = await fetchFloatData(inspectLink);
        if (!floatData) continue;

        

        const floatInfoElement = document.createElement('div');
        floatInfoElement.className = 'float-info';
        floatInfoElement.style.cssText = `
          position: absolute;
          bottom: 5px;
          left: 100px;
          color: white;
          padding: 2px 5px;
          font-size: 11px;
          border-radius: 3px;
          z-index: 10;
        `;
        floatInfoElement.innerHTML = `
          Float: ${floatData.float.toFixed(6)} | Pattern: ${floatData.seed}
        `;


        item.style.position = 'relative';
        item.appendChild(floatInfoElement);

      } catch (error) {
        console.error('Ошибка обработки предмета:', error);
        continue;
      }
    }

    return true;

  } catch (error) {
    console.error('Error in getItemFloatInfo:', error);
    return null;
  }
}

export async function fetchFloatData(inspectLink) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { action: "getFloat", inspectLink },
      (response) => {
        if (response?.success && response.float !== undefined && response.seed !== undefined) {
          resolve({
            float: response.float,
            seed: response.seed,
            fullItemName: response.full_item_name
          });
        } else {
          console.error('Float API error:', response?.error);
          resolve(null);
        }
      }
    );
  });
}

