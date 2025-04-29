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
  
    async function getSteamID64(vanityUrl) {
      try {
        // 1. Загружаем XML-страницу
        const response = await fetch(`https://steamcommunity.com/id/${vanityUrl}/?xml=1`);
        const xmlText = await response.text();
        
        // 2. Парсим XML
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");
        
        // 3. Извлекаем steamID64
        const steamID64 = xmlDoc.querySelector('steamID64').textContent;
        
        return steamID64 || null;
      } catch (error) {
        console.error('Ошибка при парсинге:', error);
        return null;
      }
    }

  

    const steamId =
    ( (typeof g_rgProfileData !== 'undefined' && g_rgProfileData.steamid) || window.location.href.match(/\/profiles\/(\d+)/)?.[1]) ||
     (typeof g_steamID !== 'undefined' && g_steamID) || await getSteamID64(window.location.href.match(/\/id\/([^\/]+)/)?.[1]) ||null;
  
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
  
      // Получаем данные из кэша или API
      async function getPrice(url) {
        try {
          // Проверка наличия кэша
          const rawCache = sessionStorage.getItem('priceCache');
          const priceCache = rawCache ? JSON.parse(rawCache) : {};

          if (priceCache[url]) {
            console.log('💾 Цена найдена в кэше:', priceCache[url]);
            return priceCache[url];
          } else {
            console.log('📡 Обращение к API для получения данных');
            const response = await chrome.runtime.sendMessage({ action: 'getPrice', url });
            
            // Защитная проверка на undefined
            if (!response) {
              throw new Error("Ответ от background.js отсутствует");
            }

            if (!response.success) {
              throw new Error(response.error || "Неизвестная ошибка при получении данных");
            }

            const priceData = response.data;
            
            // Сохраняем данные в кэш
            priceCache[url] = priceData;
            sessionStorage.setItem('priceCache', JSON.stringify(priceCache));

            return priceData;
          }

        } catch (e) {
          console.warn('❌ Ошибка получения цены:', e);
          return null;
        }
      }
  
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
        await sleep(200);
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
        // Сортируем только те элементы, которые содержат элементы
        itemsWithPrices.sort((a, b) => b.numericPrice - a.numericPrice);
        
        // Очищаем контейнер перед добавлением отсортированных элементов
        container.innerHTML = '';
        
        // Добавляем отсортированные элементы
        itemsWithPrices.forEach(({ holder }) => {
          if (holder) {  // Проверяем, что элемент существует
            container.appendChild(holder);
          }
        });
      });
  
      createButton('Сбросить сортировку', '#7a0f0f', () => {
        // Очищаем контейнер перед добавлением элементов в исходном порядке
        container.innerHTML = '';
        
        // Добавляем элементы в исходном порядке
        originalOrder.forEach(({ holder }) => {
          if (holder) {  // Проверяем, что элемент существует
            container.appendChild(holder);
          }
        });
      });
  
      console.log('🏁 Интерфейс управления добавлен');
    } catch (err) {
      console.error('❌ Ошибка выполнения content-script:', err);
    }
  })();
  