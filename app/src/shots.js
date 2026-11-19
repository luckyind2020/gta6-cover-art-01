// Fixed scenes for screenshots: ?shot=editor shows the studio with a sample
// photo loaded; ?shot=cover shows the finished poster alone at export size.
// `size` picks the export size (square, portrait, wide), `photo` the sample,
// `caption` the words. window.__shotReady is set once painted.
export async function stageShot(shot, query, hooks) {
  const size = query.get('size') || 'square';
  hooks.setSize(size);
  const img = await hooks.loadSample(query.get('photo') || 'pier');
  hooks.applySample(img, query.get('caption') || 'Sunset Heist');
  if (shot === 'cover') document.body.classList.add('shot-cover');
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
