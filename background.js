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
    console.log('Получен запрос на получение float для ссылки:', request.inspectLink);
    const floatApiUrl = `https://floats.steaminventoryhelper.com/?url=${request.inspectLink}`;
    fetch(floatApiUrl)
      .then(response => {
        console.log('Float API URL:', floatApiUrl);
        console.log('Float API status:', response.status);
        if (!response.ok) {
          return response.text().then(text => {
            console.error('Float API response text:', text);
            throw new Error('API error');
          });
        }
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
      
    return true;
  }
});