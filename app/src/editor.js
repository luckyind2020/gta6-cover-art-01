// Wires the Vice Cover Studio page: three photo slots with per-panel framing,
// caption and grade controls, three export sizes, and the ?shot= scenes the
// screenshots use. Photos are read on this machine and never uploaded.
import { paintPoster, POSTER_SIZES } from './poster.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('poster');
const titleBox = document.getElementById('title');
const tagBox = document.getElementById('tagline');
const statusBox = document.getElementById('status');
const zoomBox = document.getElementById('zoom');
const panXBox = document.getElementById('pan-x');
const panYBox = document.getElementById('pan-y');

const slots = [
  { image: null, zoom: 100, shiftX: 0, shiftY: 0 },
  { image: null, zoom: 100, shiftX: 0, shiftY: 0 },
  { image: null, zoom: 100, shiftX: 0, shiftY: 0 },
];
let arrangement = 'trio';
let grade = 'sunset';
let sizeKey = 'square';
let activeSlot = 0;
let onePhotoMode = false;

function currentFrames() {
  if (onePhotoMode) return slots.map(() => slots[0]);
  return slots;
}

export function repaint() {
  paintPoster(canvas, currentFrames(), { heading: titleBox.value, subhead: tagBox.value }, { grade, arrangement });
}

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('could not read that photo'));
    img.src = URL.createObjectURL(file);
  });
}

function syncFrameControls() {
  const slot = slots[activeSlot];
  zoomBox.value = slot.zoom;
  panXBox.value = slot.shiftX;
  panYBox.value = slot.shiftY;
  document.getElementById('zoom-val').textContent = `${slot.zoom}%`;
  document.getElementById('pan-x-val').textContent = String(slot.shiftX);
  document.getElementById('pan-y-val').textContent = String(slot.shiftY);
}

function pickButton(rowId, attr, value) {
  document.querySelectorAll(`#${rowId} button`).forEach((b) => {
    b.classList.toggle('picked', b.dataset[attr] === String(value));
  });
}

for (let i = 0; i < 3; i++) {
  document.getElementById(`photo-${i}`).addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      slots[i].image = await readImageFile(file);
      statusBox.textContent = `Photo ${i + 1} loaded — ${file.name}`;
    } catch {
      statusBox.textContent = 'That file could not be read as a photo.';
    }
    repaint();
  });
}

document.getElementById('one-photo').addEventListener('change', (e) => {
  onePhotoMode = e.target.checked;
  repaint();
});

[titleBox, tagBox].forEach((box) => box.addEventListener('input', repaint));

document.getElementById('layout-row').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-layout]');
  if (!btn) return;
  arrangement = btn.dataset.layout;
  pickButton('layout-row', 'layout', arrangement);
  repaint();
});

document.getElementById('grade-row').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-grade]');
  if (!btn) return;
  grade = btn.dataset.grade;
  pickButton('grade-row', 'grade', grade);
  repaint();
});

document.getElementById('active-row').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-panel]');
  if (!btn) return;
  activeSlot = Number(btn.dataset.panel);
  pickButton('active-row', 'panel', activeSlot);
  syncFrameControls();
});

zoomBox.addEventListener('input', () => { slots[activeSlot].zoom = Number(zoomBox.value); syncFrameControls(); repaint(); });
panXBox.addEventListener('input', () => { slots[activeSlot].shiftX = Number(panXBox.value); syncFrameControls(); repaint(); });
panYBox.addEventListener('input', () => { slots[activeSlot].shiftY = Number(panYBox.value); syncFrameControls(); repaint(); });

document.getElementById('size-row').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-size]');
  if (!btn) return;
  sizeKey = btn.dataset.size;
  const [w, h] = POSTER_SIZES[sizeKey];
  canvas.width = w;
  canvas.height = h;
  pickButton('size-row', 'size', sizeKey);
  repaint();
});

document.getElementById('export').addEventListener('click', () => {
  const [w, h] = POSTER_SIZES[sizeKey];
  canvas.toBlob((blob) => {
    if (!blob) { statusBox.textContent = 'Export failed — try again.'; return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-cover-${w}x${h}.png`;
    a.click();
    statusBox.textContent = `Saved vice-cover-${w}x${h}.png`;
  }, 'image/png');
});

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  stageShot(shot, params, {
    loadSample: (name) => new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = `samples/${name}.jpg`;
    }),
    applySample: (img, heading) => {
      slots[0].image = img;
      slots[1].image = img;
      slots[2].image = img;
      titleBox.value = heading;
      repaint();
    },
    setSize: (key) => {
      sizeKey = key;
      const [w, h] = POSTER_SIZES[key];
      canvas.width = w;
      canvas.height = h;
      pickButton('size-row', 'size', key);
      repaint();
    },
  });
} else {
  repaint();
}
