(async () => {
    try {
      console.log('🟢 Скрипт запущен');
  
      const appId = 730;
      const contextId = 2;
  
      const waitForItems = () =>
        new Promise(resolve => {
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
  
      const holders = await waitForItems();
      if (!holders.length) {
        console.warn('⚠️ Карточки не найдены');
        return;
      }
  
      const steamId =
        window.location.href.match(/\/profiles\/(\d+)/)?.[1] ||
        (typeof g_rgProfileData !== 'undefined' && g_rgProfileData.steamid) ||
        null;
  
      if (!steamId) {
        console.warn('❌ Не удалось определить Steam ID');
        return;
      }
  
      console.log('👤 Steam ID:', steamId);
  
      const inventoryUrl = `https://steamcommunity.com/inventory/${steamId}/${appId}/${contextId}?l=english&count=5000`;
      console.log('🌐 Загружается инвентарь:', inventoryUrl);
  
      const inventoryResponse = await fetch(inventoryUrl);
      if (!inventoryResponse.ok) throw new Error('❌ Ошибка загрузки инвентаря');
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
  
      // Загружаем кэш из sessionStorage
      const rawCache = sessionStorage.getItem('priceCache');
      const priceCache = rawCache ? JSON.parse(rawCache) : {};
  
      const sleep = ms => new Promise(r => setTimeout(r, ms));
  
      const getPrice = async (url) => {
        if (priceCache[url]) {
          console.log('💾 Цена из кэша:', url);
          return priceCache[url];
        }
  
        console.log('📦 Отправка запроса на цену:', url);
        return new Promise(resolve => {
          chrome.runtime.sendMessage({ action: 'getPrice', url }, (response) => {
            console.log('💰 Ответ от background-скрипта:', response);
            if (response?.success) {
              priceCache[url] = response.data;
              sessionStorage.setItem('priceCache', JSON.stringify(priceCache));
              resolve(response.data);
            } else {
              resolve(null);
            }
          });
        });
      };
  
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
        await sleep(200); // защита от дублирующихся запросов
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
        holder.style.transition = 'all 0.4s ease';
        holder.appendChild(priceLabel);
  
        const numericPrice = parseFloat(price.replace(/[^0-9.]/g, '')) || 0;
        itemsWithPrices.push({ holder, numericPrice });
      }
  
      console.log(`✅ Цены добавлены. Всего карточек с ценой: ${itemsWithPrices.length}`);
  
      // UI-панель
      const controlPanel = document.createElement('div');
      Object.assign(controlPanel.style, {
        position: 'fixed',
        top: '80px',
        right: '20px',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      });
      document.body.appendChild(controlPanel);
  
      const loadingLabel = document.createElement('div');
      loadingLabel.textContent = 'Загрузка цен...';
      Object.assign(loadingLabel.style, {
        padding: '10px 15px',
        backgroundColor: '#444',
        color: 'white',
        borderRadius: '5px',
        fontSize: '14px',
        textAlign: 'center'
      });
      controlPanel.appendChild(loadingLabel);
  
      await sleep(300);
      controlPanel.removeChild(loadingLabel);
  
      const createButton = (text, background, callback) => {
        const btn = document.createElement('button');
        btn.textContent = text;
        Object.assign(btn.style, {
          padding: '10px 15px',
          backgroundColor: background,
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '14px',
          boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
        });
        btn.addEventListener('click', () => {
          console.log(`🔘 Кнопка нажата: ${text}`);
          callback();
        });
        controlPanel.appendChild(btn);
      };
  
      const container = holders[0]?.parentElement;
      if (!container) {
        console.error('❌ Не удалось определить контейнер для itemHolder');
        return;
      }
  
      const originalOrder = [...itemsWithPrices];
  
      createButton('Сортировать по цене', '#5c7e10', () => {
        itemsWithPrices.sort((a, b) => b.numericPrice - a.numericPrice);
        itemsWithPrices.forEach(({ holder }) => container.appendChild(holder));
      });
  
      createButton('Сбросить сортировку', '#7a0f0f', () => {
        originalOrder.forEach(({ holder }) => container.appendChild(holder));
      });
  
      console.log('🏁 Интерфейс управления добавлен');
    } catch (err) {
      console.error('❌ Ошибка выполнения content-script:', err);
    }
  })();
  