# 🌍 GeoFinder AI

> Envie uma foto e descubra onde ela foi tirada no mundo — usando Google Gemini.

![Preview](https://img.shields.io/badge/status-online-3ddc84?style=flat-square)
![HTML](https://img.shields.io/badge/HTML-CSS-JS-4f8ef7?style=flat-square)
![Gemini](https://img.shields.io/badge/Google_Gemini_Flash-4285F4?style=flat-square&logo=google)
![License](https://img.shields.io/badge/licença-MIT-ffb347?style=flat-square)

---

## ✨ O que é

O **GeoFinder AI** analisa imagens — fotos de satélite, aéreas, street view ou paisagens — e identifica a localização geográfica usando o **Google Gemini Flash**. O resultado inclui cidade, país, coordenadas e um mapa interativo com a área estimada.

**[→ Acessar o GeoFinder](https://lucasbrandaocabral.github.io/GeoFinder/)**

---

## 🚀 Funcionalidades

- 📤 **Upload flexível** — arraste, clique ou cole com `Ctrl+V`
- 🤖 **Google Gemini Flash** — análise de imagens rápida e precisa
- 📍 **Resultado detalhado** — cidade, região, país, coordenadas e descrição visual
- 🗺️ **Mapa interativo** — embed do OpenStreetMap com marcador no ponto identificado
- 📊 **Nível de confiança** — alto / médio / baixo com barra de margem de erro
- 🔗 **Link direto** para o Google Maps
- 💾 **API Key salva** localmente no navegador (localStorage)

---

## 🛠️ Como usar

1. Acesse o **[site](https://lucasbrandaocabral.github.io/GeoFinder/)**
2. Clique em **⚙ Configurar API** e insira sua chave do Google Gemini
3. Envie uma imagem (arrastar, clicar ou `Ctrl+V`)
4. Clique em **🔍 Identificar Localização**

> Não tem chave? Crie uma gratuitamente em [Google AI Studio](https://aistudio.google.com/) — é só fazer login e gerar uma API Key.

---

## 🔌 Extensão para Chrome

Este repositório também inclui uma **extensão do Chrome** que permite usar o GeoFinder direto no navegador, sem sair da aba atual. Ela também tem o **Screen Finder**, que captura a tela e identifica elementos por descrição.

📁 Pasta: `chrome-extension/`
📖 Instruções de instalação: [`chrome-extension/COMO-RODAR.md`](chrome-extension/COMO-RODAR.md)

---

## 📁 Estrutura do projeto

```
GeoFinder/
├── geo-finder/
│   └── index.html        # Web app completa (HTML + CSS + JS inline)
├── chrome-extension/
│   ├── manifest.json
│   ├── popup.html / popup.js
│   ├── content.js
│   ├── background.js
│   └── COMO-RODAR.md
└── index.html            # Redirect para geo-finder/
```

---

## 📄 Licença

MIT — fique à vontade para usar, modificar e distribuir.
