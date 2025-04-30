(async () => {

    const appId = 730;
    const contextId = 2;

    // Ожидаем карточки
    const holders = await new Promise(resolve => {
      let tries = 0;
      const interval = setInterval(() => {
        const els = document.querySelectorAll('.inventory_page .itemHolder');
        if (els.length || ++tries > 10) {
          clearInterval(interval);
          resolve(els);
        }
      }, 300);
    });
    if (!holders.length) {
      console.warn('Steam Font Changer: карточки не найдены');
      return;
    }
  
    const steamId =
    (window.location.href.match(/\/profiles\/(\d+)/)?.[1]) ||
    (typeof g_rgProfileData !== 'undefined' && g_rgProfileData.steamid) ||
    null;

  
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
  
      try {
        const priceResp = await fetch(priceUrl);
        const priceJson = await priceResp.json();
  
        const price = priceJson.lowest_price || 'N/A';
  
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
      } catch (e) {
        console.warn(`Ошибка получения цены для ${marketHashName}:`, e);
      }
    }
  
    console.log(`Steam Font Changer: нанесение цен завершено. Всего карточек: ${holders.length}`);
  })();
  