/**
 * Gera ícones PNG para a extensão usando Canvas API (Node.js com canvas).
 * Execute: node generate-icons.js
 * Requer: npm install canvas
 *
 * Alternativamente, use qualquer imagem PNG de 128x128 renomeada para icon128.png
 * e redimensione para icon48.png (48x48) e icon16.png (16x16).
 */

const { createCanvas } = require('canvas');
const fs = require('fs');

function drawIcon(size) {
  const c   = createCanvas(size, size);
  const ctx = c.getContext('2d');

  // fundo arredondado
  ctx.fillStyle = '#6c63ff';
  roundRect(ctx, 0, 0, size, size, size * 0.2);
  ctx.fill();

  // lupa
  const cx = size * 0.44;
  const cy = size * 0.44;
  const r  = size * 0.26;
  ctx.strokeStyle = '#fff';
  ctx.lineWidth   = size * 0.1;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  // cabo
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx + r * 0.7, cy + r * 0.7);
  ctx.lineTo(size * 0.82, size * 0.82);
  ctx.stroke();

  return c.toBuffer('image/png');
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

[16, 48, 128].forEach(size => {
  const buf = drawIcon(size);
  fs.writeFileSync(`icon${size}.png`, buf);
  console.log(`icon${size}.png criado`);
});
