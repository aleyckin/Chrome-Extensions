chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getPrice') {
    fetch(request.url)
      .then(res => res.json())
      .then(data => sendResponse({ success: true, data }))
      .catch(err => sendResponse({ success: false, error: err.message }));

    return true;
  }
});