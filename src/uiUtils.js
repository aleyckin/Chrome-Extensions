import { waitForItems, getSteamID64, getInventory, getPrice, displayItemFloatInfo } from './apiUtils.js';
export function createControlPanel() {
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
  return controlPanel;
}

export function createSortButton(controlPanel, allItems, container, sortCounter) {
  const button = document.createElement('button');
  button.textContent = `Сортировать по цене ↑`;

  button.addEventListener('click', () => {
    const itemsWithPrices = allItems.filter(item => typeof item.numericPrice === 'number');
    const itemsWithoutPrices = allItems.filter(item => typeof item.numericPrice !== 'number');

    itemsWithPrices.sort((a, b) => {
      const priceA = typeof a.numericPrice === 'number' ? a.numericPrice : Infinity;
      const priceB = typeof b.numericPrice === 'number' ? b.numericPrice : Infinity;
      return sortCounter === 0 ? priceB - priceA : priceA - priceB;
    });

    sortCounter = 1 - sortCounter;
    button.textContent = sortCounter === 0 ? `Сортировать по цене ↑` : `Сортировать по цене ↓`;

    const sortedItems = [...itemsWithPrices, ...itemsWithoutPrices];

    const pages = [...document.querySelectorAll('.inventory_page')]
      .filter(el => el.tagName.toLowerCase() === 'div');
    const PAGE_SIZE = 25;



    // Очистить все существующие страницы
    pages.forEach(page => page.innerHTML = '');

    // Перекидываем отсортированные элементы обратно на существующие страницы
    sortedItems.forEach(({ holder }, index) => {
      const pageIndex = Math.floor(index / PAGE_SIZE);
      const page = pages[pageIndex];
      if (page) {
        page.appendChild(holder);
      } else {
        console.warn(`⚠ Страница ${pageIndex} не найдена для предмета №${index}`);
      }
    });

    console.log('✅ Сортировка завершена. Всего предметов:', sortedItems.length);
  });

  controlPanel.appendChild(button);
}


export function createResetButton(controlPanel, originalOrder, container) {
  const button = document.createElement('button');
  button.textContent = 'Сбросить сортировку';
  button.style.marginLeft = '10px';

  button.addEventListener('click', () => {
    const PAGE_SIZE = 25;
    // Получаем существующие страницы из контейнера
    const pages = [...document.querySelectorAll('.inventory_page')]
      .filter(el => el.tagName.toLowerCase() === 'div');

    // Очищаем содержимое каждой страницы
    pages.forEach(page => page.innerHTML = '');

    // Распределяем элементы из originalOrder по страницам
    originalOrder.forEach(({ holder }, index) => {
      const pageIndex = Math.floor(index / PAGE_SIZE);
      const page = pages[pageIndex];
      if (page && holder) {
        page.appendChild(holder);
      } else {
        console.warn(`⚠ Страница ${pageIndex} не найдена для предмета №${index}`);
      }
    });

    // Отобразить только первую страницу, остальные скрыть
    pages.forEach((page, i) => {
      page.style.display = i === 0 ? 'block' : 'none';
    });

    console.log('🔄 Сортировка сброшена, элементы возвращены в исходный порядок');
  });

  controlPanel.appendChild(button);
}

export async function addFloatToMarketPage() {
  try {
    // Получаем текущий URL страницы
    const currentUrl = window.location.href;

    // Проверяем, что это страница предмета CS:GO
    if (!currentUrl.includes('steamcommunity.com/market/listings/730/')) {
      return;
    }

    // Получаем данные о float
    const floatInfo = await displayItemFloatInfo(currentUrl);



  } catch (error) {
    console.error('Ошибка при добавлении float информации:', error);
  }
}


export function createResetCacheButton(controlPanel, priceCache) {
  const button = document.createElement('button');
  button.textContent = 'Сбросить кэш';
  button.style.padding = '10px 15px';
  button.style.backgroundColor = '#f44336';
  button.style.color = '#fff';
  button.style.border = 'none';
  button.style.borderRadius = '5px';
  button.style.cursor = 'pointer';

  button.addEventListener('click', () => {
    localStorage.removeItem('priceCache');

    for (const key in priceCache) {
      delete priceCache[key];
    }

    alert('Кэш цен успешно сброшен ✅');
    location.reload();
  });

  controlPanel.appendChild(button);
}



export function createTypeFilter(typeMap, controlPanel) {
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

  // Генерация чекбоксов по типам
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
    typeFilterPanel.appendChild(label);
  });

  // Кнопка для выбора всех
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


}

export function inventoryFLoatItem(container, itemInfo) {
  container.querySelectorAll(".floatInfo").forEach(e => e.remove());
  const span = document.createElement("span")
  span.className = 'floatInfo'
  span.style = `
    color: green;
    font-weight: bold`
  span.innerHTML = `<br> Float: ${itemInfo.float.toFixed(6)} | Pattern: ${itemInfo.seed}`
  container.appendChild(span);
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
    const percentage = margin / autobuyPrice * 100

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

export async function patternFinder() {
  // Находим нужные элементы DOM
  const listingInfo = document.querySelector('div.market_large_tab_well');
  const fullwidthDiv = document.querySelector('div.market_page_fullwidth');


  // Создаем контейнер для нашего элемента
  const patternSearchContainer = document.createElement('div');
  patternSearchContainer.style.margin = '20px 0';
  patternSearchContainer.style.padding = '15px';
  patternSearchContainer.style.backgroundColor = '#2c3e50';
  patternSearchContainer.style.borderRadius = '4px';

  // Добавляем заголовок
  const header = document.createElement('h2');
  header.textContent = 'Поиск по паттерну';
  header.style.color = '#ffffff';
  header.style.marginBottom = '10px';
  header.style.fontSize = '18px';

  // Создаем поле ввода
  const inputField = document.createElement('input');
  inputField.type = 'text';
  inputField.placeholder = 'Введите номер паттерна...';
  inputField.style.width = '100%';
  inputField.style.padding = '8px';
  inputField.style.borderRadius = '3px';
  inputField.style.border = '1px solid #4a5c6b';
  inputField.style.backgroundColor = '#1a1a1a';
  inputField.style.color = '#ffffff';

  // Добавляем элементы в контейнер
  patternSearchContainer.appendChild(header);
  patternSearchContainer.appendChild(inputField);
  // Вставляем между указанными div-элементами
  // if (listingInfo && fullwidthDiv) {
  //   console.log("Условия выполнены")
  //   listingInfo.parentNode.insertBefore(patternSearchContainer, fullwidthDiv);
  // }

  fullwidthDiv.appendChild(patternSearchContainer)

  // Добавляем обработчик событий для поиска
  inputField.addEventListener('input', (e) => {
    const patternNumber = e.target.value.split(",");
    const items = document.querySelectorAll('#searchResultsRows > .market_listing_row');
    for (const index in items) {
      const item = items[index]
      if (!item) {
        continue
      }
      const patternSearchNumber = item.querySelector(".float-info")
      if (!patternSearchNumber) {
        continue
      }
      const patternMatch = patternSearchNumber.innerHTML.match(/Pattern:\s*(\d+)/);
      if (!patternMatch) {
        continue
      }
      if (patternMatch  && patternNumber.includes(patternMatch[1])) {
        item.style.background ='rgb(228, 99, 99)'
      } else {
          item.style.background =''
      }
    }
  });
}

export async function quickSellItem(assetid, appid, contextid, sessionid, fullItemName) {
  const marketLinkItem = `https://steamcommunity.com/market/listings/${appid}/${fullItemName}`
  const hyperLinkItem = document.createElement('a')
  hyperLinkItem.className = 'link'
  hyperLinkItem.href = marketLinkItem
  hyperLinkItem.innerHTML = `Найти на торговой площадке`


  const container = document.querySelector(".inventory_iteminfo[style*='z-index: 1']")
  const priceText = container.querySelector(".item_market_actions").innerText;
  // Улучшенная регулярка для цен с учетом разных форматов
  const priceMatch = priceText.match(/(\d+[\.,]\d{2})|(\d+)/);

  const response = await fetch(marketLinkItem);
  if (!response.ok) throw new Error('❌ Ошибка загрузки страницы предмета');
  const html = await response.text();

  const item_nameid = html.match(/(?<=Market_LoadOrderSpread\( )\d+/);
  const histogramLink = `https://steamcommunity.com/market/itemordershistogram?country=RU&language=english&currency=5&item_nameid=${item_nameid}&two_factor=0`
  const histogramResponse = await fetch(histogramLink)
  const histogramResponseJson = await histogramResponse.json()
  const instantPrice = histogramResponseJson.highest_buy_order;
  const firstBuyOrder = (instantPrice / 100).toFixed(2)


  if (!priceMatch) {
    console.error('Цена не найдена');
    return null;
  }

  const currentPrice = parseFloat(priceMatch[0].replace(',', '.'));
  console.log(currentPrice)
  document.querySelectorAll(".fastSellButton").forEach(e => e.remove());
  document.querySelectorAll(".instantSellButton").forEach(e => e.remove());
  // 2. Создаем кнопки
  const instantSellButton = document.createElement('button');
  instantSellButton.className = 'instantSellButton'
  instantSellButton.style.cssText = `
    padding: 4px 10px;
    background: linear-gradient(to bottom, #5cb85c, #449d44);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    margin-top: 10px;
    font-weight: bold;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    transition: all 0.3s ease;
  `;
  instantSellButton.innerHTML = `Мгновенная продажа ${firstBuyOrder} рублей`;

  instantSellButton.addEventListener('click', async () => {
    try {

      instantSellButton.disabled = true;
      instantSellButton.style.opacity = '0.7';
      instantSellButton.textContent = 'Продаем...';

      // Устанавливаем цену на 0.01 ниже текущей
      const sellPrice = ((firstBuyOrder) * 86.97).toFixed(0);

      // 4. Формируем запрос
      const params = new URLSearchParams();
      params.append('sessionid', sessionid);
      params.append('appid', appid);
      params.append('contextid', contextid);
      params.append('assetid', assetid);
      params.append('amount', '1');
      params.append('price', sellPrice);

      // 5. Отправляем запрос
      const response = await fetch('https://steamcommunity.com/market/sellitem/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        },
        body: params
      });

      const result = await response.json();

      if (result.success) {
        instantSellButton.textContent = '✓ Продано!';
        instantSellButton.style.background = 'linear-gradient(to bottom, #5cb85c, #449d44)';
        setTimeout(() => button.remove(), 2000);
      } else {
        throw new Error(result.message || 'Ошибка продажи');
      }
    } catch (error) {
      console.error('Ошибка продажи:', error);
      instantSellButton.textContent = 'Ошибка! Повторить';
      instantSellButton.style.background = 'linear-gradient(to bottom, #d9534f, #c9302c)';
      instantSellButton.disabled = false;
      instantSellButton.style.opacity = '1';
    }
  });

  const button = document.createElement('button');
  button.className = 'fastSellButton'
  button.style.cssText = `
    padding: 4px 10px;
    background: linear-gradient(to bottom, #5cb85c, #449d44);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    margin-top: 10px;
    font-weight: bold;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    transition: all 0.3s ease;
  `;
  button.innerHTML = 'Быстрая продажа';

  // 3. Обработчик клика
  button.addEventListener('click', async () => {
    try {

      button.disabled = true;
      button.style.opacity = '0.7';
      button.textContent = 'Продаем...';

      // Устанавливаем цену на 0.01 ниже текущей
      const sellPrice = ((currentPrice - 0.01) * 86.97).toFixed(0);

      // 4. Формируем запрос
      const params = new URLSearchParams();
      params.append('sessionid', sessionid);
      params.append('appid', appid);
      params.append('contextid', contextid);
      params.append('assetid', assetid);
      params.append('amount', '1');
      params.append('price', sellPrice);

      // 5. Отправляем запрос
      const response = await fetch('https://steamcommunity.com/market/sellitem/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        },
        body: params
      });

      const result = await response.json();

      if (result.success) {
        button.textContent = '✓ Продано!';
        button.style.background = 'linear-gradient(to bottom, #5cb85c, #449d44)';
        setTimeout(() => button.remove(), 2000);
      } else {
        throw new Error(result.message || 'Ошибка продажи');
      }
    } catch (error) {
      console.error('Ошибка продажи:', error);
      button.textContent = 'Ошибка! Повторить';
      button.style.background = 'linear-gradient(to bottom, #d9534f, #c9302c)';
      button.disabled = false;
      button.style.opacity = '1';
    }
  });

  // 6. Добавляем кнопку в интерфейс
  const actionsContainer = container.querySelector(".item_market_actions");
  if (actionsContainer) {
    actionsContainer.appendChild(button);
    actionsContainer.appendChild(instantSellButton)
  }
  return button;
}
