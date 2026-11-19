// Paints a multi-panel sunset poster onto a canvas: the photos fill one, two or
// three framed panels above a caption band, over a hand-drawn sun, palms and a
// neon grade. Everything on the poster is drawn here in code — no game artwork,
// no logo, no outside font. `frames` is an array of up to three panel photos,
// each { image, zoom, shiftX, shiftY } (image may be null for an empty panel).
// `words` is { heading, subhead }. `look` is { grade, arrangement, width, height }.

const GRADES = {
  sunset: {
    skyTop: '#2b0f4d', skyMid: '#c22e7a', skyLow: '#ff7a2f',
    wash: 'rgba(255, 110, 60, 0.28)', sun: '#ffd76a', sunCore: '#fff3c4',
    captionFrom: '#ffe259', captionTo: '#ff5e8a', subhead: '#ffe9a8',
    band: '#170722', frame: '#ffffff',
  },
  neon: {
    skyTop: '#0b1030', skyMid: '#5b2ea6', skyLow: '#00e5c7',
    wash: 'rgba(0, 229, 199, 0.22)', sun: '#ff5ed8', sunCore: '#ffd6f6',
    captionFrom: '#7df9ff', captionTo: '#ff5ed8', subhead: '#b8fff2',
    band: '#05081f', frame: '#e8fbff',
  },
  pink: {
    skyTop: '#3d0a3d', skyMid: '#e0218a', skyLow: '#ff9e5e',
    wash: 'rgba(224, 33, 138, 0.30)', sun: '#ffb3d9', sunCore: '#fff0f7',
    captionFrom: '#ffffff', captionTo: '#ff9e5e', subhead: '#ffd6ec',
    band: '#23051f', frame: '#ffffff',
  },
};

export const POSTER_SIZES = {
  square: [1080, 1080],
  portrait: [1080, 1350],
  wide: [1920, 1080],
};

function blankPanel(ctx, x, y, w, h, grade) {
  const sky = ctx.createLinearGradient(0, y, 0, y + h);
  sky.addColorStop(0, grade.skyTop);
  sky.addColorStop(0.55, grade.skyMid);
  sky.addColorStop(1, grade.skyLow);
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, w, h);
}

function coverFit(ctx, frame, rect) {
  const img = frame.image;
  if (!img) return;
  const zoom = (frame.zoom || 100) / 100;
  const base = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight) * zoom;
  const pw = img.naturalWidth * base;
  const ph = img.naturalHeight * base;
  const dx = rect.x + (rect.w - pw) / 2 + ((frame.shiftX || 0) / 100) * rect.w;
  const dy = rect.y + (rect.h - ph) / 2 + ((frame.shiftY || 0) / 100) * rect.h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.drawImage(img, dx, dy, pw, ph);
  ctx.restore();
}

function sunsetWash(ctx, rect, grade) {
  const wash = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
  wash.addColorStop(0, 'rgba(20, 6, 40, 0.10)');
  wash.addColorStop(0.55, 'rgba(20, 6, 40, 0)');
  wash.addColorStop(1, grade.wash);
  ctx.fillStyle = wash;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  const edge = ctx.createLinearGradient(rect.x, 0, rect.x + rect.w, 0);
  edge.addColorStop(0, 'rgba(0,0,0,0.18)');
  edge.addColorStop(0.12, 'rgba(0,0,0,0)');
  edge.addColorStop(0.88, 'rgba(0,0,0,0)');
  edge.addColorStop(1, 'rgba(0,0,0,0.18)');
  ctx.fillStyle = edge;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
}

function drawSunDisc(ctx, cx, cy, r, grade) {
  const glow = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 2.1);
  glow.addColorStop(0, grade.sunCore + 'cc');
  glow.addColorStop(0.35, grade.sun + '55');
  glow.addColorStop(1, grade.sun + '00');
  ctx.fillStyle = glow;
  ctx.fillRect(cx - r * 2.2, cy - r * 2.2, r * 4.4, r * 4.4);
  ctx.fillStyle = grade.sunCore;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = grade.sun;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.82, 0, Math.PI * 2);
  ctx.fill();
  // Slatted sunset: thin dark bars cut across the low sun, poster style.
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.82, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = 'rgba(23, 7, 34, 0.55)';
  for (let i = 0; i < 4; i++) {
    const yy = cy + r * (0.05 + i * 0.2);
    ctx.fillRect(cx - r, yy, r * 2, r * (0.03 + i * 0.02));
  }
  ctx.restore();
}

function drawPalm(ctx, bx, by, s, lean) {
  ctx.save();
  ctx.translate(bx, by);
  ctx.rotate(lean);
  ctx.scale(s, s);
  ctx.strokeStyle = '#12041f';
  ctx.fillStyle = '#12041f';
  ctx.lineCap = 'round';
  // Trunk: a gentle curve, not a straight pole.
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(22, -70, 8, -148);
  ctx.stroke();
  // Fronds: arcs that rise from the crown and droop at the tips, like a palm.
  const crownX = 8;
  const crownY = -148;
  for (let i = 0; i < 7; i++) {
    const theta = -Math.PI * (0.06 + i * 0.14); // from near-horizontal right, over the top, to near-horizontal left
    const len = 62 + (i === 3 ? 22 : 0);
    const endX = crownX + Math.cos(theta) * len;
    const endY = crownY + Math.sin(theta) * len * 0.55 + 34;
    const ctrlX = crownX + Math.cos(theta) * len * 0.55;
    const ctrlY = crownY + Math.sin(theta) * len * 0.55 - 26;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(crownX, crownY);
    ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(crownX + 6, crownY + 6, 7, 0, Math.PI * 2);
  ctx.arc(crownX + 16, crownY + 12, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function panelRects(arrangement, w, h, bandH, gap) {
  const top = h - bandH;
  if (arrangement === 'single') return [{ x: gap, y: gap, w: w - gap * 2, h: top - gap * 2 }];
  if (arrangement === 'duo') {
    const half = (w - gap * 3) / 2;
    return [
      { x: gap, y: gap, w: half, h: top - gap * 2 },
      { x: gap * 2 + half, y: gap, w: half, h: top - gap * 2 },
    ];
  }
  const heroW = Math.round((w - gap * 3) * 0.6);
  const sideW = w - gap * 3 - heroW;
  const sideH = (top - gap * 3) / 2;
  return [
    { x: gap, y: gap, w: heroW, h: top - gap * 2 },
    { x: gap * 2 + heroW, y: gap, w: sideW, h: sideH },
    { x: gap * 2 + heroW, y: gap * 2 + sideH, w: sideW, h: sideH },
  ];
}

function fitHeading(ctx, text, maxW, startSize) {
  let size = startSize;
  ctx.font = `900 ${size}px "Arial Black", Arial, sans-serif`;
  while (size > 24 && ctx.measureText(text).width > maxW) {
    size -= 4;
    ctx.font = `900 ${size}px "Arial Black", Arial, sans-serif`;
  }
  return size;
}

function paintCaption(ctx, words, grade, w, h, bandH) {
  const bandY = h - bandH;
  ctx.fillStyle = grade.band;
  ctx.fillRect(0, bandY, w, bandH);
  const strip = ctx.createLinearGradient(0, 0, w, 0);
  strip.addColorStop(0, grade.captionFrom);
  strip.addColorStop(0.5, grade.captionTo);
  strip.addColorStop(1, grade.captionFrom);
  ctx.fillStyle = strip;
  ctx.fillRect(0, bandY, w, Math.max(4, bandH * 0.03));
  const heading = (words.heading || 'SUNSET HEIST').trim().toUpperCase();
  const maxW = w * 0.92;
  const size = fitHeading(ctx, heading, maxW, Math.round(bandH * 0.42));
  const cy = bandY + bandH * 0.52;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(10, 2, 20, 0.9)';
  ctx.lineWidth = size * 0.14;
  ctx.strokeText(heading, w / 2, cy);
  const fill = ctx.createLinearGradient(0, cy - size / 2, 0, cy + size / 2);
  fill.addColorStop(0, '#ffffff');
  fill.addColorStop(0.55, grade.captionFrom);
  fill.addColorStop(1, grade.captionTo);
  ctx.fillStyle = fill;
  ctx.fillText(heading, w / 2, cy);
  const sub = (words.subhead || '').trim();
  if (sub) {
    const subSize = Math.max(16, Math.round(bandH * 0.13));
    ctx.font = `700 ${subSize}px Arial, sans-serif`;
    ctx.fillStyle = grade.subhead;
    ctx.fillText(sub.toUpperCase(), w / 2, bandY + bandH * 0.86);
  }
}

export function paintPoster(canvas, frames, words, look) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const grade = GRADES[look.grade] || GRADES.sunset;
  const bandH = Math.round(h * (look.arrangement === 'single' ? 0.24 : 0.22));
  const gap = Math.round(Math.min(w, h) * 0.012);
  ctx.fillStyle = grade.band;
  ctx.fillRect(0, 0, w, h);
  const rects = panelRects(look.arrangement, w, h, bandH, gap);
  rects.forEach((rect, i) => {
    const frame = frames[i] || { image: null, zoom: 100, shiftX: 0, shiftY: 0 };
    blankPanel(ctx, rect.x, rect.y, rect.w, rect.h, grade);
    coverFit(ctx, frame, rect);
    sunsetWash(ctx, rect, grade);
    ctx.strokeStyle = grade.frame;
    ctx.lineWidth = Math.max(3, gap * 0.55);
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  });
  // Sun and palms live on the first (hero) panel, bottom corner.
  const hero = rects[0];
  const sunR = Math.min(hero.w, hero.h) * 0.16;
  drawSunDisc(ctx, hero.x + hero.w * 0.78, hero.y + hero.h * 0.24, sunR, grade);
  const palmS = Math.min(hero.w, hero.h) / 340;
  drawPalm(ctx, hero.x + hero.w * 0.1, hero.y + hero.h * 0.99, palmS, 0.1);
  drawPalm(ctx, hero.x + hero.w * 0.24, hero.y + hero.h * 0.99, palmS * 0.7, -0.14);
  paintCaption(ctx, words, grade, w, h, bandH);
}
