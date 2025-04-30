chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if (request.action === 'getPrice') {
      try {
        const response = await fetch(request.url);
        const data = await response.json();
        sendResponse({ success: true, data });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
      return true;
    }
  });
  