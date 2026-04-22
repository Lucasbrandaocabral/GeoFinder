# GeoFinder — Como instalar e usar a extensão

## 1. Ícones (opcional para testes)

Os ícones são declarados no manifest mas **não bloqueiam o carregamento** durante desenvolvimento.
Para gerar automaticamente:

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

1. Clique no ícone da extensão na barra do Chrome
2. Clique no botão ⚙ (configurações)
3. Cole sua **Google Gemini API Key**
   - Obtenha gratuitamente em: https://aistudio.google.com/
4. Clique em **Salvar configurações**

---

## 4. Usar o Screen Finder

Encontre qualquer elemento visual na tela atual por descrição.

1. Acesse qualquer página no Chrome
2. Abra o painel da extensão
3. Na aba **🔍 Screen Finder**, digite o que deseja encontrar  
   Ex: *"botão de fechar"*, *"minimap"*, *"ícone de notificação"*
4. Clique em **📷 Capturar Tela**
5. A tela aparecerá no painel — **arraste para selecionar** a região de interesse (opcional)
6. Clique em **🤖 Analisar com IA**
7. Resultado:
   - Coordenadas X/Y do elemento (em % da imagem)
   - Marcador visual na imagem (ponto vermelho + caixa delimitadora)
   - Descrição textual da localização
   - Nível de confiança

---

## 5. Usar o GeoFinder

Identifique a localização geográfica de qualquer imagem.

1. Na aba **🌍 GeoFinder**, arraste uma imagem, clique para selecionar ou cole com `Ctrl+V`
2. Clique em **🔍 Identificar Localização**
3. Resultado:
   - Cidade, região e país identificados
   - Coordenadas geográficas
   - Mapa interativo com o ponto estimado
   - Link direto para o Google Maps

---

## 6. Estrutura dos arquivos

```
chrome-extension/
├── manifest.json       # Configuração MV3 da extensão
├── popup.html          # Interface do usuário
├── popup.js            # Lógica: captura, seleção, chamada à IA, resultado
├── background.js       # Service Worker: captura a aba (captureVisibleTab)
├── content.js          # Content Script: expõe devicePixelRatio
├── styles.css          # Estilo dark do popup
└── icons/
    ├── icon16.png      # (gerar com generate-icons.js)
    ├── icon48.png
    ├── icon128.png
    └── generate-icons.js
```

---

## 7. Permissões usadas

| Permissão | Motivo |
|---|---|
| `activeTab` | Capturar a aba ativa com captureVisibleTab |
| `tabs` | Identificar a janela/aba correta |
| `storage` | Salvar API Key localmente |
| `sidePanel` | Abrir como painel lateral no Chrome |
| `<all_urls>` | Permitir captureVisibleTab a partir do painel lateral |

Nenhum dado é enviado a terceiros além da API do Google Gemini configurada pelo usuário.
