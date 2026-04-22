// Abre o side panel ao clicar no ícone da extensão
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'captureTab') {
    captureActiveTab(sendResponse);
    return true; // mantém o canal aberto para a resposta assíncrona
  }
});

async function captureActiveTab(sendResponse) {
  try {
    // Obtém a janela atual para garantir que capturamos a aba certa
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab) {
      sendResponse({ error: 'Nenhuma aba ativa encontrada.' });
      return;
    }

    const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
      format: 'png',
      quality: 100,
    });

    sendResponse({ dataUrl, tabWidth: tab.width, tabHeight: tab.height });
  } catch (err) {
    sendResponse({ error: err.message });
  }
}
