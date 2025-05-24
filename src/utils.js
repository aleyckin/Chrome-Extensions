import { getPrice } from "./apiUtils";

export function calculateTotalPrice(itemsWithPrices) {
    return itemsWithPrices.reduce((sum, item) => {
      return !isNaN(item.numericPrice) ? sum + item.numericPrice : sum;
    }, 0);
  }

export async function renderPriceForHolder(holder, assetMap, descriptionMap, appId, priceCache, itemsWithPrices, typeMap) {
  const itemDiv = holder.querySelector('.item');
  if (!itemDiv || holder.dataset.priceHandled === 'true') return;

  holder.dataset.priceHandled = 'true';

  const link = holder.querySelector('a.inventory_item_link');
  const assetKey = link && link.href.startsWith('#')
    ? link.href.slice(link.href.indexOf('#') + 1)
    : itemDiv.id;

  const assetId = assetKey.split('_')[2];
  let descriptionKey = assetMap[assetId];

  if (!descriptionKey && itemDiv.dataset.classid && itemDiv.dataset.instanceid) {
    descriptionKey = itemDiv.dataset.classid + '_' + itemDiv.dataset.instanceid;
    assetMap[assetId] = descriptionKey;
  }

  const description = descriptionMap[descriptionKey];
  if (!description) {
    console.warn('⛔ Описание не найдено для assetId:', assetId, 'descriptionKey:', descriptionKey);
    return;
  }

  const type = description.type || 'Other';
  if (!typeMap.has(type)) {
    typeMap.set(type, []);
  }
  typeMap.get(type).push(holder);

  const marketHashName = encodeURIComponent(description.market_hash_name);
  const priceUrl = `https://steamcommunity.com/market/priceoverview/?country=RU&currency=5&appid=${appId}&market_hash_name=${marketHashName}`;

  const priceData = await getPrice(priceUrl, priceCache);
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

  const numericPrice = parseFloat(price.replace(/[^0-9,]/g, '')) || 0;
  itemsWithPrices.push({ holder, numericPrice });
}

export async function renderPricesOnPage(pageElem, assetMap, descriptionMap, appId, priceCache, itemsWithPrices, typeMap) {
  const holders = pageElem.querySelectorAll('.itemHolder');
  for (const holder of holders) {
    await renderPriceForHolder(holder, assetMap, descriptionMap, appId, priceCache, itemsWithPrices, typeMap);
  }
}
