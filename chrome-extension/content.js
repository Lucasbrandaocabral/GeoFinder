// Content Script — responde pings e expõe o devicePixelRatio para correção de escala

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'ping') {
    sendResponse({ alive: true, dpr: window.devicePixelRatio || 1 });
  }
});
