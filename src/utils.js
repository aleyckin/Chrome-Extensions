export function calculateTotalPrice(itemsWithPrices) {
    return itemsWithPrices.reduce((sum, item) => {
      return !isNaN(item.numericPrice) ? sum + item.numericPrice : sum;
    }, 0);
  }
  