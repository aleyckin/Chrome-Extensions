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
  