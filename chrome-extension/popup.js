(function () {
  'use strict';

  const $ = id => document.getElementById(id);

  // ── Abas ─────────────────────────────────────────────
  document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
      btn.classList.add('active');
      $('tab-' + btn.dataset.tab).classList.remove('hidden');
    });
  });

  // ── Configurações (compartilhadas) ───────────────────
  chrome.storage.local.get(['apiKey'], data => {
    if (data.apiKey) $('apiKey').value = data.apiKey;
  });

  $('settingsToggle').addEventListener('click', () =>
    $('settingsPanel').classList.toggle('hidden')
  );

  $('toggleKey').addEventListener('click', () => {
    const inp = $('apiKey');
    inp.type = inp.type === 'password' ? 'text' : 'password';
  });

  $('saveSettings').addEventListener('click', () => {
    const key = $('apiKey').value.trim();
    if (!key) { showScreenStatus('Digite uma API Key.', 'error'); return; }
    chrome.storage.local.set({ apiKey: key }, () => {
      showScreenStatus('Configurações salvas!', 'success');
      setTimeout(() => $('settingsPanel').classList.add('hidden'), 700);
    });
  });

  function getConfig() {
    return { apiKey: $('apiKey').value.trim() };
  }

  // ══════════════════════════════════════════════════════
  // ABA: SCREEN FINDER
  // ══════════════════════════════════════════════════════

  let fullScreenshot = null;
  let displayedImage = null;
  let canvasScale    = 1;
  let selection      = null;
  let isDragging     = false;

  const captureBtn  = $('captureBtn');
  const analyzeBtn  = $('analyzeBtn');
  const clearBtn    = $('clearBtn');
  const canvas      = $('previewCanvas');
  const canvasHint  = $('canvasHint');
  const ctx         = canvas.getContext('2d');

  captureBtn.addEventListener('click', async () => {
    setScreenUI('loading');
    try {
      const resp = await bgMessage({ action: 'captureTab' });
      if (resp.error) throw new Error(resp.error);
      fullScreenshot = resp.dataUrl;
      await renderOnCanvas(fullScreenshot);
      selection = null;
      setScreenUI('captured');
      showScreenStatus('Arraste para selecionar uma região ou analise a tela inteira.', 'info');
    } catch (err) {
      setScreenUI('idle');
      showScreenStatus('Erro ao capturar: ' + err.message, 'error');
    }
  });

  clearBtn.addEventListener('click', () => {
    selection = null;
    if (displayedImage) drawCanvas();
    showScreenStatus('Seleção removida.', 'info');
  });

  analyzeBtn.addEventListener('click', async () => {
    const { apiKey } = getConfig();
    if (!apiKey) {
      showScreenStatus('Configure a API Key (⚙).', 'error');
      $('settingsPanel').classList.remove('hidden');
      return;
    }
    const query = $('searchQuery').value.trim() || 'elemento principal';
    const imageDataUrl = selection ? cropSelection() : fullScreenshot;

    setScreenUI('analyzing');
    $('resultSection').classList.add('hidden');
    try {
      const result = await analyzeImage(imageDataUrl, query, apiKey);
      showScreenResult(result, imageDataUrl);
      setScreenUI('done');
    } catch (err) {
      setScreenUI('done');
      showScreenStatus('Erro: ' + err.message, 'error');
    }
  });

  async function renderOnCanvas(dataUrl) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        canvasScale = Math.min(658 / img.width, 400 / img.height, 1);
        canvas.width  = Math.floor(img.width  * canvasScale);
        canvas.height = Math.floor(img.height * canvasScale);
        displayedImage = img;
        drawCanvas();
        canvasHint.classList.add('hidden');
        canvas.style.display = 'block';
        resolve();
      };
      img.src = dataUrl;
    });
  }

  function drawCanvas(live) {
    if (!displayedImage) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(displayedImage, 0, 0, canvas.width, canvas.height);
    const r = live || selection;
    if (!r) return;
    const { x, y, w, h } = normRect(r);
    if (w < 2 || h < 2) return;

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillRect(x, y, w, h);
    ctx.restore();

    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.drawImage(displayedImage, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    ctx.strokeStyle = '#00d4ff'; ctx.lineWidth = 1.5;
    ctx.strokeRect(x + .5, y + .5, w - 1, h - 1);
    drawCorners(x, y, w, h);
  }

  function drawCorners(x, y, w, h) {
    const s = 10;
    ctx.strokeStyle = '#00d4ff'; ctx.lineWidth = 2.5;
    [[x,y+s,x,y,x+s,y],[x+w,y+s,x+w,y,x+w-s,y],
     [x,y+h-s,x,y+h,x+s,y+h],[x+w,y+h-s,x+w,y+h,x+w-s,y+h]].forEach(([x1,y1,x2,y2,x3,y3]) => {
      ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.lineTo(x3,y3); ctx.stroke();
    });
  }

  canvas.addEventListener('mousedown', e => {
    if (!displayedImage) return;
    isDragging = true;
    const r = canvas.getBoundingClientRect();
    const x = clamp(e.clientX - r.left, 0, canvas.width);
    const y = clamp(e.clientY - r.top,  0, canvas.height);
    selection = { x1: x, y1: y, x2: x, y2: y };
  });
  canvas.addEventListener('mousemove', e => {
    if (!isDragging) return;
    const r = canvas.getBoundingClientRect();
    selection.x2 = clamp(e.clientX - r.left, 0, canvas.width);
    selection.y2 = clamp(e.clientY - r.top,  0, canvas.height);
    drawCanvas(selection);
  });
  canvas.addEventListener('mouseup', e => {
    if (!isDragging) return;
    isDragging = false;
    const r = canvas.getBoundingClientRect();
    selection.x2 = clamp(e.clientX - r.left, 0, canvas.width);
    selection.y2 = clamp(e.clientY - r.top,  0, canvas.height);
    const { w, h } = normRect(selection);
    if (w < 10 || h < 10) { selection = null; drawCanvas(); return; }
    drawCanvas();
    showScreenStatus(`Região selecionada (${Math.round(w)}×${Math.round(h)}px). Clique em Analisar.`, 'success');
  });
  canvas.addEventListener('mouseleave', () => { if (isDragging) { isDragging = false; drawCanvas(); } });

  function cropSelection() {
    const { x, y, w, h } = normRect(selection);
    const tmp = document.createElement('canvas');
    tmp.width = w / canvasScale; tmp.height = h / canvasScale;
    tmp.getContext('2d').drawImage(displayedImage,
      x / canvasScale, y / canvasScale, w / canvasScale, h / canvasScale,
      0, 0, w / canvasScale, h / canvasScale);
    return tmp.toDataURL('image/png');
  }

  function showScreenResult(result, imageDataUrl) {
    $('resultSection').classList.remove('hidden');
    if (!result.found) {
      $('resultCoords').textContent = '—';
      $('resultSize').textContent   = '—';
      $('resultDescription').textContent = result.description || 'Não encontrado.';
      setScreenBadge('—', '');
      showScreenStatus('Elemento não encontrado.', 'warn');
      return;
    }
    const cx = +result.x || 0, cy = +result.y || 0;
    const bw = +result.width || 5, bh = +result.height || 5;
    $('resultCoords').textContent = `X: ${cx.toFixed(1)}%  |  Y: ${cy.toFixed(1)}%`;
    $('resultSize').textContent   = `${bw.toFixed(1)}% × ${bh.toFixed(1)}%`;
    $('resultDescription').textContent = result.description || '—';
    const conf = (result.confidence || 'médio').toLowerCase();
    const [lbl, cls] = { alto:['Alto','high'], médio:['Médio','medium'], baixo:['Baixo','low'] }[conf] || ['—',''];
    setScreenBadge(lbl, cls);
    showScreenStatus(`Localizado com confiança ${lbl.toLowerCase()}.`, 'success');
    drawMarker(imageDataUrl, cx, cy, bw, bh);

    const lat = parseFloat(result.latitude), lng = parseFloat(result.longitude);
    const mapWrap = $('screenMapWrap');
    if (!isNaN(lat) && !isNaN(lng)) {
      const delta = 0.05;
      const bbox  = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`;
      $('screenMapImg').src =
        `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
      mapWrap.classList.remove('hidden');
      const link = $('screenMapsLink');
      link.href = `https://www.google.com/maps?q=${lat},${lng}`;
      link.style.display = '';
    } else {
      mapWrap.classList.add('hidden');
      $('screenMapsLink').style.display = 'none';
    }
  }

  function drawMarker(dataUrl, xp, yp, wp, hp) {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(658 / img.width, 380 / img.height, 1);
      canvas.width  = Math.floor(img.width  * scale);
      canvas.height = Math.floor(img.height * scale);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const cx = (xp/100)*canvas.width, cy = (yp/100)*canvas.height;
      const bw = (wp/100)*canvas.width, bh = (hp/100)*canvas.height;

      ctx.setLineDash([4,4]); ctx.strokeStyle='rgba(255,77,109,.5)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(cx,0); ctx.lineTo(cx,canvas.height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0,cy); ctx.lineTo(canvas.width,cy); ctx.stroke();
      ctx.setLineDash([]);

      ctx.strokeStyle='#ff4d6d'; ctx.lineWidth=2;
      ctx.strokeRect(cx-bw/2, cy-bh/2, bw, bh);

      ctx.fillStyle='rgba(255,77,109,.2)';
      ctx.beginPath(); ctx.arc(cx,cy,12,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#ff4d6d';
      ctx.beginPath(); ctx.arc(cx,cy,5,0,Math.PI*2); ctx.fill();

      const lbl = `${xp.toFixed(0)}%, ${yp.toFixed(0)}%`;
      const tx = clamp(cx+10,4,canvas.width-85), ty = clamp(cy-10,14,canvas.height-4);
      ctx.font='bold 11px monospace';
      const tw = ctx.measureText(lbl).width;
      ctx.fillStyle='rgba(0,0,0,.75)'; ctx.fillRect(tx-3,ty-12,tw+6,16);
      ctx.fillStyle='#ff4d6d'; ctx.fillText(lbl,tx,ty);

      displayedImage = img; canvasScale = scale;
    };
    img.src = dataUrl;
  }

  function setScreenUI(state) {
    const s = { idle:{cap:false,ana:true,clr:true,ld:false},
                loading:{cap:true,ana:true,clr:true,ld:false},
                captured:{cap:false,ana:false,clr:false,ld:false},
                analyzing:{cap:true,ana:true,clr:true,ld:true},
                done:{cap:false,ana:false,clr:false,ld:false} }[state] || {};
    captureBtn.disabled = s.cap; analyzeBtn.disabled = s.ana; clearBtn.disabled = s.clr;
    $('loading').classList.toggle('hidden', !s.ld);
  }

  function showScreenStatus(msg, type) {
    const el = $('statusMsg');
    el.textContent = msg; el.className = `status-msg ${type}`;
    el.classList.remove('hidden');
  }

  function setScreenBadge(t, c) {
    $('resultBadge').textContent = t;
    $('resultBadge').className = `badge ${c}`;
  }

  // ══════════════════════════════════════════════════════
  // ABA: GEOFINDER
  // ══════════════════════════════════════════════════════

  let geoImgDataUrl = null;

  const uploadArea = $('uploadArea');
  const geoFile    = $('geoFileInput');

  uploadArea.addEventListener('click', () => geoFile.click());
  geoFile.addEventListener('change', e => { if (e.target.files[0]) geoLoadFile(e.target.files[0]); });

  uploadArea.addEventListener('dragover',  e => { e.preventDefault(); uploadArea.classList.add('drag-over'); });
  uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('drag-over'));
  uploadArea.addEventListener('drop', e => {
    e.preventDefault(); uploadArea.classList.remove('drag-over');
    const f = e.dataTransfer.files[0];
    if (f?.type.startsWith('image/')) geoLoadFile(f);
  });

  document.addEventListener('paste', e => {
    if ($('tab-geo').classList.contains('hidden')) return;
    const item = [...e.clipboardData.items].find(i => i.type.startsWith('image/'));
    if (item) geoLoadFile(item.getAsFile());
  });

  function geoLoadFile(file) {
    const reader = new FileReader();
    reader.onload = ev => {
      geoImgDataUrl = ev.target.result;
      const img = document.createElement('img');
      img.id = 'geoPreview'; img.src = geoImgDataUrl;
      uploadArea.innerHTML = '';
      uploadArea.classList.add('has-image');
      uploadArea.appendChild(img);
      $('geoAnalyzeBtn').disabled = false;
      $('geoClearBtn').style.display = '';
      $('geoResult').classList.add('hidden');
      showGeoStatus('Imagem carregada. Clique em "Identificar Localização".', 'info');
    };
    reader.readAsDataURL(file);
  }

  $('geoClearBtn').addEventListener('click', () => {
    geoImgDataUrl = null;
    geoFile.value = '';
    uploadArea.classList.remove('has-image');
    uploadArea.innerHTML = `
      <span class="upload-icon">🛰️</span>
      <span class="upload-title">Arraste uma imagem aqui</span>
      <span class="upload-sub">ou clique para selecionar · Ctrl+V para colar</span>
      <input type="file" id="geoFileInput" accept="image/*" style="display:none" />`;
    uploadArea.onclick = () => $('geoFileInput').click();
    $('geoFileInput').onchange = e => { if (e.target.files[0]) geoLoadFile(e.target.files[0]); };
    $('geoAnalyzeBtn').disabled = true;
    $('geoClearBtn').style.display = 'none';
    $('geoResult').classList.add('hidden');
    showGeoStatus('Configure a API Key (⚙), depois envie uma imagem.', 'info');
  });

  $('geoAnalyzeBtn').addEventListener('click', async () => {
    const { apiKey } = getConfig();
    if (!apiKey) {
      showGeoStatus('Configure a API Key (⚙).', 'error');
      $('settingsPanel').classList.remove('hidden');
      return;
    }
    setGeoLoading(true);
    $('geoResult').classList.add('hidden');
    try {
      const b64 = geoImgDataUrl.split(',')[1];
      const result = await geoCallAI(b64, apiKey);
      geoRenderResult(result);
    } catch (err) {
      showGeoStatus('Erro: ' + err.message, 'error');
    } finally {
      setGeoLoading(false);
    }
  });

  const GEO_PROMPT = `Você é especialista em geolocalização visual.
Analise a imagem (satélite, aérea, street view ou paisagem) e identifique a localização.

Responda SOMENTE com JSON válido, sem markdown:
{"found":true,"latitude":-23.5505,"longitude":-46.6333,"city":"São Paulo","region":"SP","country":"Brasil","description":"características que levaram à identificação","confidence":"alto","radius_km":20}

- confidence: "alto"(<50km), "médio"(50-200km), "baixo"(>200km)
- radius_km: margem de erro em km
- Se não identificável: {"found":false,"description":"motivo"}`;

  async function geoCallAI(b64, key) {
    const models = await resolveGeminiModels(key);
    const t = await geminiGenerateContent(models, key, {
      contents: [{ parts: [{ inline_data: { mime_type: 'image/jpeg', data: b64 } }, { text: GEO_PROMPT }] }],
      generationConfig: { maxOutputTokens: 600, temperature: 0.1 }
    });
    return parseJ(t);
  }

  async function resolveGeminiModels(key) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    if (!res.ok) throw new Error('Não foi possível listar modelos. Verifique a API Key.');
    const { models = [] } = await res.json();
    const vision = models.filter(m =>
      m.supportedGenerationMethods?.includes('generateContent') &&
      !m.name.includes('embedding') && !m.name.includes('aqa') &&
      (m.name.includes('flash') || m.name.includes('gemini-1.5') || m.name.includes('gemini-2'))
    );
    if (!vision.length) throw new Error('Nenhum modelo Gemini disponível nesta API Key.');
    // ordena: lite/8b primeiro (menos demanda), depois flash, depois o resto
    vision.sort((a, b) => {
      const score = m => m.name.includes('lite') || m.name.includes('8b') ? 0 : m.name.includes('flash') ? 1 : 2;
      return score(a) - score(b);
    });
    return vision.map(m => m.name.replace('models/', ''));
  }

  async function geminiGenerateContent(models, key, body) {
    let lastErr;
    for (const model of models) {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
      );
      if (res.status === 429 || res.status === 503) { lastErr = new Error((await res.json().catch(()=>({}))).error?.message || `HTTP ${res.status}`); continue; }
      if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.error?.message || `HTTP ${res.status}`); }
      const d = await res.json();
      const t = d.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!t) throw new Error('Resposta vazia do Gemini.');
      return t;
    }
    throw lastErr || new Error('Todos os modelos Gemini indisponíveis. Tente novamente em alguns minutos.');
  }

  function geoRenderResult(r) {
    $('geoResult').classList.remove('hidden');

    if (!r.found) {
      $('geoCity').textContent    = 'Não identificado';
      $('geoCountry').textContent = '—';
      $('geoCoords').textContent  = '—';
      $('geoDesc').textContent    = r.description || 'Imagem não reconhecível.';
      $('geoRadius').textContent  = '—';
      $('geoFill').style.width    = '0%';
      $('mapsLink').style.display = 'none';
      setGeoBadge('—', '');
      showGeoStatus('Localização não identificada.', 'warn');
      return;
    }

    const lat  = +r.latitude  || 0;
    const lng  = +r.longitude || 0;
    const rkm  = +r.radius_km || 100;
    const conf = (r.confidence || 'médio').toLowerCase();

    $('geoCity').textContent    = r.city || '—';
    $('geoCountry').textContent = [r.region, r.country].filter(Boolean).join(', ') || '—';
    $('geoCoords').textContent  = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    $('geoDesc').textContent    = r.description || '—';
    $('geoRadius').textContent  = `~${rkm} km`;
    $('geoFill').style.width    = Math.max(0, 100 - Math.min(rkm / 5, 100)) + '%';

    const [lbl, cls] = { alto:['Alto','high'], médio:['Médio','medium'], baixo:['Baixo','low'] }[conf] || ['—',''];
    setGeoBadge(lbl, cls);

    $('mapsLink').href = `https://www.google.com/maps?q=${lat},${lng}`;
    $('mapsLink').style.display = '';

    const delta = rkm < 5 ? 0.05 : rkm < 20 ? 0.2 : rkm < 100 ? 1.0 : rkm < 500 ? 5.0 : 20.0;
    const bbox  = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`;
    $('geoMapImg').src =
      `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
    showGeoStatus(`${r.city || 'Local identificado'}${r.country ? ', ' + r.country : ''} — confiança ${lbl.toLowerCase()}.`, 'success');
  }

  function showGeoStatus(msg, type) {
    const el = $('geoStatus');
    el.textContent = msg; el.className = `status-msg ${type}`;
  }

  function setGeoBadge(t, c) {
    $('geoBadge').textContent = t; $('geoBadge').className = `badge ${c}`;
  }

  function setGeoLoading(v) {
    $('geoLoading').classList.toggle('hidden', !v);
    $('geoAnalyzeBtn').disabled = v;
  }

  // ══════════════════════════════════════════════════════
  // Integração com IA (Screen Finder)
  // ══════════════════════════════════════════════════════

  const SCREEN_PROMPT = query =>
    `Analise esta imagem e encontre: "${query}".\n\n` +
    `Responda APENAS com JSON válido:\n` +
    `{"found":true,"x":45,"y":30,"width":12,"height":8,"description":"localização detalhada","confidence":"alto"}\n\n` +
    `x,y = centro em % (0-100). width,height = dimensões em %. confidence: alto/médio/baixo.\n` +
    `Se a imagem mostrar um local real (mapa, satélite, street view, paisagem, cidade), adicione também: "latitude", "longitude", "city", "country".\n` +
    `Se não encontrar: {"found":false,"description":"motivo"}`;

  async function analyzeImage(dataUrl, query, apiKey) {
    const b64 = dataUrl.split(',')[1];
    const prompt = SCREEN_PROMPT(query);
    const models = await resolveGeminiModels(apiKey);
    const t = await geminiGenerateContent(models, apiKey, {
      contents: [{ parts: [{ inline_data: { mime_type: 'image/png', data: b64 } }, { text: prompt }] }],
      generationConfig: { maxOutputTokens: 512, temperature: 0.2 }
    });
    return parseJ(t);
  }

  // ── Helpers ──────────────────────────────────────────
  function normRect(r) {
    const x = Math.min(r.x1, r.x2), y = Math.min(r.y1, r.y2);
    return { x, y, w: Math.abs(r.x2-r.x1), h: Math.abs(r.y2-r.y1) };
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function parseJ(text) {
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) throw new Error('Resposta inválida da IA: ' + text.slice(0, 120));
    return JSON.parse(m[0]);
  }
  function bgMessage(msg) {
    return new Promise((res, rej) => chrome.runtime.sendMessage(msg, r => {
      chrome.runtime.lastError ? rej(new Error(chrome.runtime.lastError.message)) : res(r);
    }));
  }

})();
