# AI Screen Finder — Como instalar e usar

## 1. Ícones (opcional para testes)

Os ícones são declarados no manifest mas **não bloqueiam o carregamento** durante desenvolvimento.
Para gerar os ícones automaticamente:

```bash
cd icons
npm install canvas
node generate-icons.js
```

Ou copie qualquer PNG e renomeie para `icon16.png`, `icon48.png`, `icon128.png` dentro da pasta `icons/`.

---

## 2. Carregar no Chrome (modo desenvolvedor)

1. Abra o Chrome e acesse: `chrome://extensions/`
2. Ative o toggle **"Modo do desenvolvedor"** (canto superior direito)
3. Clique em **"Carregar sem compactação"**
4. Selecione a pasta `chrome-extension/`
5. A extensão aparecerá na barra de ferramentas

---

## 3. Configurar a API Key

1. Clique no ícone da extensão (🔍) na barra do Chrome
2. Clique no botão ⚙ (configurações)
3. Escolha o provedor: **Claude (Anthropic)** ou **GPT-4o (OpenAI)**
4. Cole sua API Key:
   - **Claude**: obtenha em https://console.anthropic.com/
   - **OpenAI**: obtenha em https://platform.openai.com/api-keys
5. Clique em **Salvar configurações**

---

## 4. Usar a extensão

1. Acesse qualquer página no Chrome
2. Abra o popup da extensão
3. Digite o que deseja encontrar no campo de busca  
   Ex: *"botão de fechar"*, *"minimap"*, *"ícone de notificação"*
4. Clique em **📷 Capturar Tela**
5. A tela atual aparecerá no popup — **arraste para selecionar** a região de interesse (opcional)
6. Clique em **🤖 Analisar com IA**
7. Aguarde o resultado:
   - Coordenadas X/Y do elemento (em % da imagem)
   - Marcador visual (ponto vermelho + caixa delimitadora) na imagem
   - Descrição textual da localização
   - Nível de confiança da análise

---

## 5. Estrutura dos arquivos

```
chrome-extension/
├── manifest.json       # Configuração MV3 da extensão
├── popup.html          # Interface do usuário
├── popup.js            # Lógica: captura, seleção, chamada à IA, resultado
├── background.js       # Service Worker: captura a aba (captureVisibleTab)
├── content.js          # Content Script: expõe devicePixelRatio
├── styles.css          # Estilo dark/moderno do popup
└── icons/
    ├── icon16.png      # (gerar com generate-icons.js)
    ├── icon48.png
    ├── icon128.png
    └── generate-icons.js
```

---

## 6. Exemplo de chamada à API (Claude)

```js
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type':      'application/json',
    'x-api-key':         SUA_API_KEY,
    'anthropic-version': '2023-06-01',
  },
  body: JSON.stringify({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: {
            type:       'base64',
            media_type: 'image/png',
            data:        BASE64_DA_IMAGEM,
          },
        },
        { type: 'text', text: 'Onde está o botão de fechar? Retorne JSON.' },
      ],
    }],
  }),
});
const data = await response.json();
console.log(data.content[0].text); // JSON com { found, x, y, width, height, description, confidence }
```

---

## 7. Permissões usadas

| Permissão     | Motivo                                      |
|---------------|---------------------------------------------|
| `activeTab`   | Capturar a aba ativa com captureVisibleTab  |
| `tabs`        | Identificar a janela/aba correta            |
| `storage`     | Salvar API Key e preferências localmente    |

Nenhum dado é enviado a terceiros além da API configurada pelo usuário.
