const CATEGORIES = {
  category0: { label: 'Spongebob Characters', words: ['Spongebob', 'Patrick', 'Gary', 'Larry', 'Plankton', 'Patchy', 'Sandy', 'Mystery', 'Karen', 'Mr. Krabs'], color: '#8b5cf6' },
  category1: { label: 'Friend Slop Games', words: ['Peak', 'Lethal Company', 'Meccha Chameleon', 'Among Us', 'Goblin Cleanup', 'Repo', 'Content Warning', 'Plate Up', 'Terraria', 'Human Fall Flat'], color: '#22c55e' },
  category2: { label: 'Fictional Scientists', words: ['Ryland Grace', 'Doc Brown', 'Rick Sanchez', 'Walter White', 'Victor Frankenstein', 'Dana Scully', 'Sheldon Cooper', 'Hubert Farnsworth', 'Heinz Doofenshmirtz', 'Gordon Freeman'], color: '#3b82f6' },
  category3: { label: 'Evil Software', words: ['Quickbooks', 'Sage', 'Bluebeam', 'Zee Drive', 'Citrix', 'Printix', 'Sharepoint', 'Yardi One', 'Adobe Acrobat', 'Ring Central'], color: '#f97316' },
  category4: { label: 'World Leader\'s First Names', words: ['Benjamin', 'Donald', 'Narendra', 'Kim', 'Emmanuel', 'Vladimir', 'Xi', 'Volodymyr', 'Andy', 'Mark'], color: '#ef4444' },
  category5: { label: 'Animals', words: ['Penguin', 'Cat', 'Dog', 'Bear', 'Frog', 'Chicken', 'Cow', 'Sheep', 'Pig', 'Monkey'], color: '#84cc16' },
  category6: { label: 'Fast Food', words: ['Taco Bell', 'Raising Canes', 'McDonalds', 'Chick-Fil-A', 'Burger King', 'Wingstop', 'Domino\'s', 'Culver\'s', 'Arby\'s', 'Popeyes'], color: '#06b6d4' },
  category7: { label: 'The Ankh Shield', words: ['Bezoar', 'Trifold Map', 'Blindfold', 'Vitamins', 'Armor Polish', 'Megaphone', 'Fast Clock', 'Nazar', 'Pocket Mirror', 'Cobalt Shield'], color: '#eab308' },
  category8: { label: 'Creepypastas O_O', words: ['Jeff the Killer', 'Ben Drowned', 'Smile Dog', 'Slenderman', 'Sonic.exe', 'Squidward Suicide', 'Momo', 'Russian Sleep Expiriment', 'The Rake', 'Herobrine'], color: '#ec4899' },
  category9: { label: 'Ben Monday', words: ['5\'3\"', 'The Joker', 'Homeschooled', 'Never Seen Spongebob', 'Just a Little Guy', 'The Kid Named Finger', 'Humble Shrimp Farmer', 'Femcel Larper', 'Netanyahu', 'Nerd Emoji'], color: '#14b8a6' },
};

const GRID_COLS = 10;
const GRID_ROWS = 10;
const REF_CELL_W = 130;
const REF_CELL_H = 64;

const workspace = document.getElementById('workspace');
const missesEl = document.getElementById('misses');
const solvedEl = document.getElementById('solved');
const timerEl = document.getElementById('timer');
const winOverlay = document.getElementById('win-message');
const winStats = document.getElementById('win-stats');
const resetBtn = document.getElementById('reset-btn');
const winCloseBtn = document.getElementById('win-close-btn');
const autoSolveBtn = document.getElementById('auto-solve-btn');
const fireworksCanvas = document.getElementById('fireworks-canvas');
const fireworksCtx = fireworksCanvas.getContext('2d');

const OVERLAP_THRESHOLD = 0.3; // Hitbox % value
const CLICK_MOVE_THRESHOLD = 6; // Threshold for click vs drag behavior
const TOOLTIP_DELAY = 500; // Value for how long a box needs to be hovered for the extended info to appear
const TRUNCATE_AT = 2; // Shorten box descriptions after this many words

let boxes = [];
let misses = 0;
let idCounter = 0;
let dragState = null;
let startTime = null;
let elapsedSeconds = 0;
let timerInterval = null;
let selectedBox = null;

function totalCategories() {
  return Object.keys(CATEGORIES).length;
}

function init() {
  clearBoxes();
  misses = 0;
  idCounter = 0;
  selectedBox = null;
  winOverlay.classList.add('hidden');
  stopFireworks();
  updateStats();
  startTimer();

  const allWords = [];
  Object.entries(CATEGORIES).forEach(([key, cat]) => {
    cat.words.forEach(word => allWords.push({ key, word }));
  });
  shuffle(allWords);

  const slots = computeGridSlots();
  allWords.forEach(({ key, word }, i) => {
    const slot = slots[i];
    createBox({ categoryKey: key, words: [word], x: slot.x, y: slot.y, slot });
  });
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function computeGridSlots() {
  const wsRect = workspace.getBoundingClientRect();
  const cellW = wsRect.width / GRID_COLS;
  const cellH = wsRect.height / GRID_ROWS;
  const pad = Math.max(3, Math.min(8, Math.min(cellW, cellH) * 0.08));
  const scale = Math.max(0.55, Math.min(1.25, Math.min(cellW / REF_CELL_W, cellH / REF_CELL_H)));

  const slots = [];
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      slots.push({
        x: col * cellW + pad,
        y: row * cellH + pad,
        maxWidth: cellW - pad * 2,
        fontSize: Math.round(14 * scale),
        paddingV: Math.round(10 * scale),
        paddingH: Math.round(14 * scale),
      });
    }
  }
  shuffle(slots);
  return slots;
}

function renderBoxContent(el, words) {
  el.innerHTML = '';
  if (words.length > TRUNCATE_AT) {
    el.dataset.words = words.join(', ');
    const shown = words.slice(0, TRUNCATE_AT);
    el.append(shown.join(', ') + ', ... ');
    const countSpan = document.createElement('span');
    countSpan.className = 'word-count';
    countSpan.textContent = `[${words.length}]`;
    el.appendChild(countSpan);
  } else {
    delete el.dataset.words;
    el.textContent = words.join(', ');
  }
}

function createBox({ categoryKey, words, x, y, slot }) {
  const id = 'box-' + (idCounter++);
  const el = document.createElement('div');
  el.className = 'box';
  el.id = id;
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  if (slot) {
    el.style.minWidth = '0';
    el.style.maxWidth = slot.maxWidth + 'px';
    el.style.fontSize = slot.fontSize + 'px';
    el.style.padding = slot.paddingV + 'px ' + slot.paddingH + 'px';
  }
  renderBoxContent(el, words);
  el.addEventListener('pointerdown', onPointerDown);
  workspace.appendChild(el);
  const box = { id, categoryKey, words: words.slice(), el, x, y, solved: false, tooltipTimer: null };
  el.addEventListener('mouseenter', () => scheduleTooltip(box));
  el.addEventListener('mouseleave', () => cancelTooltip(box));
  boxes.push(box);
  return box;
}

function scheduleTooltip(box) {
  cancelTooltip(box);
  if (!box.el.dataset.words || box.el.classList.contains('dragging')) return;
  box.tooltipTimer = setTimeout(() => {
    box.el.classList.add('tooltip-visible');
    box.tooltipTimer = null;
  }, TOOLTIP_DELAY);
}

function cancelTooltip(box) {
  if (box.tooltipTimer) {
    clearTimeout(box.tooltipTimer);
    box.tooltipTimer = null;
  }
  box.el.classList.remove('tooltip-visible');
}

function removeBox(box) {
  cancelTooltip(box);
  box.el.remove();
  boxes = boxes.filter(b => b.id !== box.id);
}

function clearBoxes() {
  boxes.forEach(b => {
    cancelTooltip(b);
    b.el.remove();
  });
  boxes = [];
}

function onPointerDown(e) {
  const box = boxes.find(b => b.id === e.currentTarget.id);
  if (!box) return;
  cancelTooltip(box);
  e.currentTarget.setPointerCapture(e.pointerId);
  dragState = {
    box,
    pointerId: e.pointerId,
    startX: box.x,
    startY: box.y,
    pointerStartX: e.clientX,
    pointerStartY: e.clientY,
    wsRect: workspace.getBoundingClientRect(),
  };
  box.el.classList.add('dragging');
  box.el.style.zIndex = 1000;
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
}

function onPointerMove(e) {
  if (!dragState) return;
  const dx = e.clientX - dragState.pointerStartX;
  const dy = e.clientY - dragState.pointerStartY;
  const box = dragState.box;
  const w = box.el.offsetWidth;
  const h = box.el.offsetHeight;
  const maxX = Math.max(dragState.wsRect.width - w, 0);
  const maxY = Math.max(dragState.wsRect.height - h, 0);
  let newX = Math.min(Math.max(dragState.startX + dx, 0), maxX);
  let newY = Math.min(Math.max(dragState.startY + dy, 0), maxY);
  box.x = newX;
  box.y = newY;
  box.el.style.left = newX + 'px';
  box.el.style.top = newY + 'px';
}

function onPointerUp(e) {
  if (!dragState) return;
  const box = dragState.box;
  const startX = dragState.startX;
  const startY = dragState.startY;
  box.el.classList.remove('dragging');
  box.el.style.zIndex = '';
  window.removeEventListener('pointermove', onPointerMove);
  window.removeEventListener('pointerup', onPointerUp);
  dragState = null;

  const moved = Math.abs(box.x - startX) > CLICK_MOVE_THRESHOLD || Math.abs(box.y - startY) > CLICK_MOVE_THRESHOLD;

  if (!moved) {
    // Snap back exactly (undoes any sub-threshold jitter) and treat this as a click instead of a drag.
    box.x = startX;
    box.y = startY;
    box.el.style.left = startX + 'px';
    box.el.style.top = startY + 'px';
    handleBoxClick(box);
    rehoverAt(e.clientX, e.clientY);
    return;
  }

  clearSelection();
  const target = findOverlapTarget(box);
  if (target && !box.solved && !target.solved) {
    if (target.categoryKey === box.categoryKey) {
      mergeBoxes(box, target);
    } else {
      misses++;
      updateStats();
      snapBack(box, startX, startY);
      pulseMiss(target.el);
    }
  }
  rehoverAt(e.clientX, e.clientY);
}

// The box under the cursor may have moved, been replaced by a merge, or snapped back
// without the cursor itself moving off it, so no fresh `mouseenter` fires there on its
// own. Re-check what's actually under the pointer now and (re)start its tooltip delay.
function rehoverAt(clientX, clientY) {
  const el = document.elementFromPoint(clientX, clientY);
  const boxEl = el ? el.closest('.box') : null;
  if (!boxEl) return;
  const hoverBox = boxes.find(b => b.el === boxEl);
  if (hoverBox) scheduleTooltip(hoverBox);
}

function selectBox(box) {
  clearSelection();
  selectedBox = box;
  box.el.classList.add('selected');
}

function clearSelection() {
  if (selectedBox) {
    selectedBox.el.classList.remove('selected');
    selectedBox = null;
  }
}

function handleBoxClick(box) {
  if (box.solved) {
    // Solved categories can't merge further; clicking one just cancels any pending selection.
    clearSelection();
    return;
  }

  if (!selectedBox) {
    selectBox(box);
    return;
  }

  if (selectedBox.id === box.id) {
    clearSelection();
    return;
  }

  const first = selectedBox;
  clearSelection();

  if (first.categoryKey === box.categoryKey) {
    mergeBoxes(first, box);
  } else {
    misses++;
    updateStats();
    pulseMiss(first.el);
    pulseMiss(box.el);
  }
}

function rectOf(box) {
  return {
    x: box.x,
    y: box.y,
    w: box.el.offsetWidth,
    h: box.el.offsetHeight,
  };
}

function findOverlapTarget(box) {
  const a = rectOf(box);
  const aArea = a.w * a.h;
  let best = null;
  let bestRatio = 0;
  boxes.forEach(other => {
    if (other.id === box.id) return;
    const b = rectOf(other);
    const overlapX = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
    const overlapY = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
    const overlapArea = overlapX * overlapY;
    const bArea = b.w * b.h;
    // Measure against the smaller of the two boxes so a big combined box can
    // still merge with a small single-word box (and vice versa).
    const ratio = overlapArea / Math.min(aArea, bArea);
    if (ratio >= OVERLAP_THRESHOLD && ratio > bestRatio) {
      bestRatio = ratio;
      best = other;
    }
  });
  return best;
}

function snapBack(box, x, y) {
  box.x = x;
  box.y = y;
  box.el.style.left = x + 'px';
  box.el.style.top = y + 'px';
  pulseMiss(box.el);
}

function pulseMiss(el) {
  el.classList.remove('miss-shake');
  el.offsetWidth;
  el.classList.add('miss-shake');
  setTimeout(() => el.classList.remove('miss-shake'), 500);
}

function mergeBoxes(dragged, target) {
  const combinedWords = Array.from(new Set([...dragged.words, ...target.words]));
  const catKey = dragged.categoryKey;
  const cat = CATEGORIES[catKey];
  const x = target.x, y = target.y;
  removeBox(dragged);
  removeBox(target);
  const merged = createBox({ categoryKey: catKey, words: combinedWords, x, y });
  merged.el.classList.add('merge-correct');
  setTimeout(() => merged.el.classList.remove('merge-correct'), 550);

  if (combinedWords.length === cat.words.length) {
    merged.solved = true;
    merged.el.classList.add('solved');
    merged.el.style.background = cat.color;
    merged.el.textContent = cat.label;
    merged.el.dataset.words = combinedWords.join(', ');
  }
  updateStats();
  checkWin();
}

function checkWin() {
  const solvedCount = boxes.filter(b => b.solved).length;
  if (solvedCount === totalCategories()) {
    stopTimer();
    winStats.textContent = `You solved today's puzzle in ${formatTime(elapsedSeconds)} with ${misses} miss${misses === 1 ? '' : 'es'}!`;
    winOverlay.classList.remove('hidden');
    startFireworks();
  }
}

function updateStats() {
  missesEl.textContent = misses;
  const solvedCount = boxes.filter(b => b.solved).length;
  solvedEl.textContent = `${solvedCount} / ${totalCategories()}`;
}

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function startTimer() {
  stopTimer();
  startTime = Date.now();
  elapsedSeconds = 0;
  timerEl.textContent = formatTime(0);
  timerInterval = setInterval(() => {
    elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
    timerEl.textContent = formatTime(elapsedSeconds);
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

// Firework code courtesy of Claude

const FIREWORK_COLORS = ['#f87171', '#fb923c', '#fbbf24', '#a3e635', '#4ade80', '#2dd4bf', '#38bdf8', '#818cf8', '#c084fc', '#f472b6'];

let fireworksParticles = [];
let fireworksSpawnInterval = null;
let fireworksRafId = null;
let fireworksActive = false;

function resizeFireworksCanvas() {
  const rect = workspace.getBoundingClientRect();
  fireworksCanvas.width = rect.width;
  fireworksCanvas.height = rect.height;
}

function spawnFirework() {
  const w = fireworksCanvas.width;
  const h = fireworksCanvas.height;
  const x = w * (0.15 + Math.random() * 0.7);
  const y = h * (0.15 + Math.random() * 0.5);
  const color = FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)];
  const count = 40 + Math.floor(Math.random() * 20);
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.2;
    const speed = 1.5 + Math.random() * 2.5;
    fireworksParticles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      alpha: 1,
      color,
      decay: 0.008 + Math.random() * 0.01,
      radius: 3.5 + Math.random() * 2,
    });
  }
}

function fireworksTick() {
  fireworksCtx.clearRect(0, 0, fireworksCanvas.width, fireworksCanvas.height);
  fireworksParticles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.03;
    p.alpha -= p.decay;
  });
  fireworksParticles = fireworksParticles.filter(p => p.alpha > 0);
  fireworksParticles.forEach(p => {
    fireworksCtx.globalAlpha = Math.max(p.alpha, 0);
    fireworksCtx.fillStyle = p.color;
    fireworksCtx.beginPath();
    fireworksCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    fireworksCtx.fill();
  });
  fireworksCtx.globalAlpha = 1;
  if (fireworksActive || fireworksParticles.length > 0) {
    fireworksRafId = requestAnimationFrame(fireworksTick);
  } else {
    fireworksRafId = null;
  }
}

function startFireworks() {
  if (fireworksActive) return;
  resizeFireworksCanvas();
  fireworksActive = true;
  spawnFirework();
  fireworksSpawnInterval = setInterval(spawnFirework, 500);
  if (!fireworksRafId) fireworksRafId = requestAnimationFrame(fireworksTick);
}

function stopFireworks() {
  fireworksActive = false;
  if (fireworksSpawnInterval) {
    clearInterval(fireworksSpawnInterval);
    fireworksSpawnInterval = null;
  }
  fireworksParticles = [];
  if (fireworksRafId) {
    cancelAnimationFrame(fireworksRafId);
    fireworksRafId = null;
  }
  fireworksCtx.clearRect(0, 0, fireworksCanvas.width, fireworksCanvas.height);
}

// Auto solving for testing purposes.

function autoSolveAll() {
  clearSelection();
  const wsRect = workspace.getBoundingClientRect();
  const cols = totalCategories();
  const cellW = wsRect.width / cols;
  const pad = 8;

  Object.entries(CATEGORIES).forEach(([key, cat], index) => {
    const existing = boxes.filter(b => b.categoryKey === key);
    existing.forEach(b => removeBox(b));

    const merged = createBox({
      categoryKey: key,
      words: cat.words.slice(),
      x: index * cellW + pad,
      y: pad,
    });
    merged.solved = true;
    merged.el.classList.add('solved');
    merged.el.style.background = cat.color;
    merged.el.textContent = cat.label;
    merged.el.dataset.words = cat.words.join(', ');
  });

  updateStats();
  checkWin();
}

resetBtn.addEventListener('click', init);
winCloseBtn.addEventListener('click', () => winOverlay.classList.add('hidden'));
autoSolveBtn.addEventListener('click', autoSolveAll);

init();
