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
  
      // Загружаем кэш из localStorage
      const rawCache = localStorage.getItem('priceCache');
      const priceCache = rawCache ? JSON.parse(rawCache) : {};
  
      const sleep = ms => new Promise(r => setTimeout(r, ms));
  
      // Получаем данные из кэша или API
      async function getPrice(url) {
        try {
          // Проверка наличия кэша
          const rawCache = localStorage.getItem('priceCache');
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
            localStorage.setItem('priceCache', JSON.stringify(priceCache));

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
      
      let sortCounter = 0;
      const symbols = ['↑', '↓'];
      
      createButton(`Сортировать по цене ${symbols[sortCounter]}`, '#5c7e10', function() {
        // Сортируем элементы в зависимости от состояния
        itemsWithPrices.sort((a, b) => 
          sortCounter === 0 ? b.numericPrice - a.numericPrice : a.numericPrice - b.numericPrice
        );
      
        // Меняем состояние сортировки для следующего клика
        sortCounter = 1 - sortCounter;
        
        // Добавляем небольшую задержку, чтобы кнопка успела обновить текст
        setTimeout(() => {
          // Обновляем текст кнопки
          this.textContent = `Сортировать по цене ${symbols[sortCounter]}`;
        }, 50);
      
        // Очищаем контейнер перед добавлением отсортированных элементов
        container.innerHTML = '';
        
        // Добавляем отсортированные элементы в контейнер
        itemsWithPrices.forEach(({ holder }) => holder && container.appendChild(holder));
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
      
      // Сбор всех типов
      const typeMap = new Map();

      itemsWithPrices.forEach(({ holder }) => {
        const itemDiv = holder.querySelector('.item');
        const link = holder.querySelector('a.inventory_item_link');
        const assetKey = link && link.href.startsWith('#')
          ? link.href.slice(link.href.indexOf('#') + 1)
          : itemDiv.id;

        const assetId = assetKey.split('_')[2];
        const descriptionKey = assetMap[assetId];
        const description = descriptionMap[descriptionKey];
        if (!description) return;

        const type = description.type || 'Other';

        if (!typeMap.has(type)) {
          typeMap.set(type, []);
        }

        typeMap.get(type).push(holder);
      });

      // UI-фильтр по типу
      const typeFilterPanel = document.createElement('div');
      Object.assign(typeFilterPanel.style, {
        padding: '10px',
        backgroundColor: '#222',
        borderRadius: '5px',
        color: 'white',
        fontSize: '13px',
        maxWidth: '200px',
        overflowY: 'auto',
        maxHeight: '300px'
      });
      typeFilterPanel.innerHTML = '<b>Фильтр по типу:</b><br>';
      controlPanel.appendChild(typeFilterPanel);

      const checkboxStates = {};
      const checkboxes = {};
      let allChecked = false;

      typeMap.forEach((holders, type) => {
        const label = document.createElement('label');
        label.style.display = 'block';
        label.style.cursor = 'pointer';
        label.style.marginBottom = '5px';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = true;
        checkboxStates[type] = true;

        checkboxes[type] = checkbox;

        checkbox.addEventListener('change', () => {
          checkboxStates[type] = checkbox.checked;
          holders.forEach(h => {
            h.style.display = checkbox.checked ? '' : 'none';
          });
        });

        label.appendChild(checkbox);
        label.append(` ${type}`);
        typeFilterPanel.appendChild(label);;
      });

      // Обёртка для кнопки
      const toggleContainer = document.createElement('div');
      toggleContainer.style.marginBottom = '10px';

      const toggleAllBtn = document.createElement('button');
      toggleAllBtn.textContent = 'Выбрать все';
      toggleAllBtn.style.margin = '10px';
      toggleAllBtn.style.padding = '5px 10px';
      toggleAllBtn.style.cursor = 'pointer';

      toggleContainer.appendChild(toggleAllBtn);
      typeFilterPanel.prepend(toggleContainer);

      allChecked = Object.values(checkboxes).every(cb => cb.checked);
      toggleAllBtn.textContent = allChecked ? 'Снять все' : 'Выбрать все';

      toggleAllBtn.addEventListener('click', () => {
        allChecked = !allChecked;

        Object.entries(checkboxes).forEach(([type, checkbox]) => {
          checkbox.checked = allChecked;
          checkboxStates[type] = allChecked;

          const holders = typeMap.get(type);
          if (holders) {
            holders.forEach(h => {
              h.style.display = allChecked ? '' : 'none';
            });
          }
        });

        toggleAllBtn.textContent = allChecked ? 'Снять все' : 'Выбрать все';
      });


      const totalPrice = itemsWithPrices.reduce((sum, item) => {
        let price = item.numericPrice;
      
        if (typeof price === 'string') {
          // Удаляем всё, кроме цифр, точки и запятой
          price = price.replace(/[^\d.,]/g, '');
      
          // Заменяем запятую на точку, если есть
          price = price.replace(',', '.');
      
          // Преобразуем в число
          price = parseFloat(price);
        }
      
        // Если число валидное — добавляем
        return !isNaN(price) ? sum + price : sum;
      }, 0);

       // Создаем элемент для вывода общей стоимости
       const totalPriceDiv = document.createElement('div');
       Object.assign(totalPriceDiv.style, {
         marginTop: '10px',
         fontWeight: 'bold',
         fontSize: '14px',
         color: '#4caf50'
       });
       totalPriceDiv.textContent = `💲 Общая стоимость: $${totalPrice.toFixed(2)}`;
 
       controlPanel.appendChild(totalPriceDiv);

      console.log('🏁 Интерфейс управления добавлен');
    } catch (err) {
      console.error('❌ Ошибка выполнения content-script:', err);
    }
  })();
  