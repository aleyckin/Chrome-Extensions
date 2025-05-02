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
  
  
  
  export function createTypeFilter(controlPanel, itemsWithPrices) {
    const typeFilterPanel = document.createElement('div');
    typeFilterPanel.style.padding = '10px';
    typeFilterPanel.style.backgroundColor = '#222';
    typeFilterPanel.style.color = 'white';
    typeFilterPanel.innerHTML = '<b>Фильтр по типу:</b>';
    controlPanel.appendChild(typeFilterPanel);
  }
  