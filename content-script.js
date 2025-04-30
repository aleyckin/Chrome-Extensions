(async () => {
    const appId = 730;
    const contextId = 2;
  
    const waitForItems = () =>
      new Promise(resolve => {
        let tries = 0;
        const interval = setInterval(() => {
          const els = document.querySelectorAll('.inventory_page .itemHolder');
          if (els.length || ++tries > 10) {
            clearInterval(interval);
            resolve(els);
          }
        }, 300);
      });
  
    const holders = await waitForItems();
    if (!holders.length) {
      console.warn('Steam Font Changer: карточки не найдены');
      return;
    }
  
    const steamId =
      window.location.href.match(/\/profiles\/(\d+)/)?.[1] ||
      (typeof g_rgProfileData !== 'undefined' && g_rgProfileData.steamid) ||
      null;
  
    if (!steamId) {
      console.warn('Steam Font Changer: не удалось определить Steam ID');
      return;
    }
  
    const inventoryUrl = `https://steamcommunity.com/inventory/${steamId}/${appId}/${contextId}?l=english&count=5000`;
    const inventoryResponse = await fetch(inventoryUrl);
    const inventoryJson = await inventoryResponse.json();
    const assets = inventoryJson.assets || [];
    const descriptions = inventoryJson.descriptions || [];
  
    const assetMap = {};
    assets.forEach(asset => {
      assetMap[asset.assetid] = asset.classid + '_' + asset.instanceid;
    });
  
    const descriptionMap = {};
    descriptions.forEach(desc => {
      const key = desc.classid + '_' + desc.instanceid;
      descriptionMap[key] = desc;
    });
  
    const getPrice = (url) =>
      new Promise(resolve => {
        chrome.runtime.sendMessage({ action: 'getPrice', url }, (response) => {
          if (response?.success) resolve(response.data);
          else resolve(null);
        });
      });
  
    const itemsWithPrices = [];
  
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
  
      const marketHashName = encodeURIComponent(description.market_hash_name);
      const priceUrl = `https://steamcommunity.com/market/priceoverview/?currency=1&appid=${appId}&market_hash_name=${marketHashName}`;
  
      const priceData = await getPrice(priceUrl);
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
  
    // Создание кнопки сортировки
    const sortButton = document.createElement('button');
    sortButton.textContent = 'Сортировать по цене';
    Object.assign(sortButton.style, {
    position: 'fixed',
    top: '80px',
    right: '20px',
    zIndex: 10000,
    padding: '10px 15px',
    backgroundColor: '#5c7e10',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
    });
    document.body.appendChild(sortButton);

    // Обработчик сортировки
    sortButton.addEventListener('click', () => {
    const container = document.querySelector('.inventory_page .inventory_items');
    if (container) {
        itemsWithPrices.sort((a, b) => b.numericPrice - a.numericPrice);
        itemsWithPrices.forEach(({ holder }) => container.appendChild(holder));
        sortButton.textContent = 'Отсортировано ✅';
        sortButton.disabled = true;
    }
    });
  
    console.log(`Steam Font Changer: нанесение цен и сортировка завершены. Всего карточек: ${holders.length}`);
  })();
  