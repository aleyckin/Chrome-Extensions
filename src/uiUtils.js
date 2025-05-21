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
  
  export function createSortButton(controlPanel, itemsWithPrices, container, sortCounter) {
    const button = document.createElement('button');
    button.textContent = `Сортировать по цене ↑`;
    button.addEventListener('click', () => {
      itemsWithPrices.sort((a, b) => sortCounter === 0 ? b.numericPrice - a.numericPrice : a.numericPrice - b.numericPrice);
      sortCounter = 1 - sortCounter;
      container.innerHTML = '';
      itemsWithPrices.forEach(({ holder }) => container.appendChild(holder));
    });
    controlPanel.appendChild(button);
  }
  
  export function createResetButton(controlPanel, itemsWithPrices, container, originalOrder) {
    const button = document.createElement('button');
    button.textContent = 'Сбросить сортировку';
    button.style.marginLeft = '10px';
    button.addEventListener('click', () => {
      container.innerHTML = ''; 
      originalOrder.forEach(({ holder }) => {
        if (holder) container.appendChild(holder);
      });
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
  