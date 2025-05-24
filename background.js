// Обработчик сообщений от content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getPrice') {
    // Обработка запроса цен
    fetch(request.url)
      .then(res => res.json())
      .then(data => sendResponse({ success: true, data }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    
    return true; // Необходимо для асинхронного ответа
  }
  
  if (request.action === 'getFloat') {
    // Обработка запроса float значений
    fetch(`https://floats.steaminventoryhelper.com/?url=${encodeURIComponent(request.inspectLink)}`)
      .then(response => {
        if (!response.ok) throw new Error('API error');
        return response.json();
      })
      .then(data => {
        if (!data?.iteminfo) throw new Error('Invalid float data');
        sendResponse({
          success: true,
          float: data.iteminfo.floatvalue,
          seed: data.iteminfo.paintseed
        });
      })
      .catch(error => {
        console.error('Float API error:', error);
        sendResponse({
          success: false,
          error: error.message
        });
      });
      
    return true; // Необходимо для асинхронного ответа
  }
});