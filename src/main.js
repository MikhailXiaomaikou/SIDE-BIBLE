import { BOOKS, CATEGORIES, SOURCES, EDITORIAL_NOTE } from './content.js';
import { readProgress, writeProgress, currentScene, nextPosition, revealNext, jumpTo, toggleBookmark } from './state.js';
import { World } from './world.js';
import { Soundscape } from './audio.js';

const $ = id => document.getElementById(id);
const escape = text => String(text).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const roman = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];
const totalScenes = BOOKS.reduce((total, book) => total + book.scenes.length, 0);
let localStore;
try { localStore = window.localStorage; } catch { localStore = null; }
let progress = readProgress(localStore, BOOKS);
let inReader = false;
let category = 'all';
let journalMode = 'visited';
let hold = null;
let holdFrame = 0;
let toastTimer = 0;
let storageWarning = false;
let skipAccessibleClick = false;
let revealTimer = 0;
let breathing = false;
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const world = new World($('world'));
const sound = new Soundscape();
const captions = {
  watchers: ['守望者之境', '群山之上，仍有星辰'], garden: ['园中旧梦', '失去之后，记忆生长'],
  river: ['远行者的河', '流动的水，归家的路'], city: ['城门之内', '灯火守候无名的人'],
  wisdom: ['智慧之光', '在万物之间寻找秩序'], temple: ['殿前微光', '石与光保留着回声'],
  birds: ['泥土与羽翼', '故事从尘土中飞起'], desert: ['旷野余声', '残页也有自己的声音'],
  dawn: ['黎明之际', '新的光抵达旧的世界'], tower: ['活石之塔', '每一块石头都有位置']
};

function toast(message) {
  clearTimeout(toastTimer); $('statusToast').textContent = message;
  $('statusToast').classList.add('visible');
  toastTimer = setTimeout(() => $('statusToast').classList.remove('visible'), 3200);
}
function save() {
  if (!writeProgress(localStore, progress) && !storageWarning) {
    storageWarning = true; toast('浏览器未允许保存；本次仍可阅读，关闭后可能无法续读。');
  }
  renderProgress();
}
function renderProgress() {
  $('readCount').textContent = progress.visited.length;
  $('journalCount').textContent = progress.visited.length;
  $('totalCount').textContent = ` / ${totalScenes}`;
  $('progressFill').style.width = `${progress.visited.length / totalScenes * 100}%`;
  $('editionCount').textContent = '十二部古卷，七十二幕故事';
  $('progressButton').setAttribute('aria-label', `已拾得 ${progress.visited.length} 幕，共 ${totalScenes} 幕，打开拾页`);
  $('beginLabel').textContent = progress.started ? '继续上次阅读' : '单击开启';
  const { book } = currentScene(progress, BOOKS);
  $('entryHint').textContent = progress.started ? `上次读到《${book.title}》 · 第 ${progress.sceneIndex + 1} 幕` : '移动光点 · 按住显影 · 松手成章';
}
function applyMotion() {
  const reduced = motionPreference.matches || progress.readerMode;
  document.body.classList.toggle('still', reduced);
  world.setReducedMotion(reduced);
  $('motionSetting').checked = progress.readerMode;
}
function sceneAt(position) {
  const book = BOOKS.find(item => item.id === position.bookId);
  return { book, scene: book.scenes[position.sceneIndex] };
}
function renderReader(changeWorld = true) {
  const { book, scene } = currentScene(progress, BOOKS);
  document.body.dataset.theme = scene.theme;
  $('reader').dataset.revealed = String(progress.revealed);
  $('currentBookButton').textContent = book.title;
  $('currentBookButton').setAttribute('aria-label', `当前书卷：${book.title}，打开书卷目录`);
  $('sceneCounter').textContent = `第 ${progress.sceneIndex + 1} 幕 / ${book.scenes.length}`;
  $('sceneLabel').textContent = scene.title;
  $('sceneTitle').textContent = progress.revealed ? scene.invocation : book.title;
  $('narrative').textContent = progress.revealed ? scene.narrative : book.summary;
  $('narrative').classList.toggle('preview', !progress.revealed);
  $('reference').textContent = progress.revealed ? `${scene.reference} · 叙事改写` : `${book.englishTitle} · ${book.scenes.length} 幕`;
  $('sceneDots').innerHTML = book.scenes.map((item, sceneIndex) => `<button class="${progress.visited.includes(item.id) ? 'read ' : ''}${sceneIndex === progress.sceneIndex ? 'active' : ''}" data-scene="${sceneIndex}" aria-label="第 ${sceneIndex + 1} 幕：${escape(item.title)}" ${sceneIndex === progress.sceneIndex ? 'aria-current="step"' : ''}></button>`).join('');
  const bookmarked = progress.bookmarks.includes(scene.id);
  $('bookmarkButton').setAttribute('aria-pressed', String(bookmarked));
  $('bookmarkButton').setAttribute('aria-label', bookmarked ? '取消收藏此页' : '收藏此页');
  $('bookmarkButton').querySelector('span').textContent = bookmarked ? '已收藏' : '收藏';
  $('bookmarkButton').disabled = !progress.revealed;
  const last = !nextPosition(progress, BOOKS);
  $('holdLabel').textContent = breathing ? '故事正在展开…' : last ? '按住，合上古卷' : progress.revealed ? '按住画面，唤醒下一页' : '按住画面，让文字浮现';
  $('nextButton').textContent = last ? '旅程回顾' : progress.revealed ? '下一幕' : '单击阅读';
  const caption = captions[scene.theme] || captions.watchers;
  $('landscapeName').textContent = caption[0]; $('landscapeDetail').textContent = caption[1];
  if (changeWorld) world.setScene(scene.theme, (progress.sceneIndex + (progress.revealed ? 1 : 0)) / book.scenes.length, book.color, { sceneId: scene.id, bookId: book.id, revealed: progress.revealed, landing: false });
}
function openReader() {
  settleReveal();
  inReader = true; progress.started = true;
  $('homeButton').hidden = false;
  $('landing').hidden = true; $('reader').hidden = false;
  document.body.classList.add('in-reader');
  renderReader(); save();
  if (progress.sound) sound.setEnabled(true).then(ok => { if (!ok) { progress.sound = false; renderSound(); save(); } });
}
function home() {
  cancelHold(); settleReveal(); inReader = false;
  $('homeButton').hidden = true;
  document.body.dataset.theme = 'watchers';
  $('landing').hidden = false; $('reader').hidden = true;
  document.body.classList.remove('in-reader');
  world.setScene('watchers', .1, '#a4bdcc', { sceneId: 'cover', bookId: 'enoch', revealed: false, landing: true });
  $('landscapeName').textContent = captions.watchers[0]; $('landscapeDetail').textContent = captions.watchers[1];
  renderProgress();
}
function advance() {
  if (!inReader || document.querySelector('dialog[open]')) return;
  settleReveal();
  const result = revealNext(progress, BOOKS);
  if (result.finished) {
    const complete = progress.visited.length === totalScenes;
    $('finishSummary').textContent = complete ? `你已走过 ${BOOKS.length} 部书卷的 ${totalScenes} 幕故事。读过的段落都在“拾页”里，随时可以回来。` : `你已抵达最后一幕，共拾得 ${progress.visited.length} / ${totalScenes} 幕。书卷目录里还有未读的故事，随时可以回去寻找。`;
    openDialog('finishDialog'); return;
  }
  progress = result.progress; renderReader(); save(); world.pulse(); sound.chime(progress.sceneIndex);
  const { scene } = currentScene(progress, BOOKS);
  setUtterance(scene.invocation, true);
  if (!motionPreference.matches && !progress.readerMode) {
    breathing = true;
    document.body.classList.remove('revealing');
    void $('utterance').offsetWidth;
    document.body.classList.add('revealing');
    $('holdButton').disabled = true;
    $('holdLabel').textContent = '故事正在展开…';
    revealTimer = setTimeout(settleReveal, 2600);
  }
}
function selectScene(bookId, sceneIndex = 0, reveal = false) {
  cancelHold(); closeDialogs();
  progress = jumpTo(progress, BOOKS, bookId, sceneIndex);
  openReader();
  if (reveal) advance();
}
function openDialog(id) {
  cancelHold(); settleReveal(); closeDialogs(); $(id).showModal();
}
function closeDialogs() { document.querySelectorAll('dialog[open]').forEach(dialog => dialog.close()); }
function openLibrary() { category = 'all'; $('bookSearch').value = ''; renderLibrary(); openDialog('libraryDialog'); }
function renderLibrary() {
  $('categoryTabs').innerHTML = [{ id: 'all', label: '全部书卷' }, ...CATEGORIES].map(item => `<button data-category="${escape(item.id)}" aria-pressed="${category === item.id}">${escape(item.label)}</button>`).join('');
  const search = $('bookSearch').value.trim().toLocaleLowerCase();
  const filtered = BOOKS.filter(book => (category === 'all' || book.category === category) && [book.title, book.englishTitle, book.summary, book.tradition, ...book.scenes.map(scene => scene.title + scene.narrative)].join(' ').toLocaleLowerCase().includes(search));
  $('bookList').innerHTML = filtered.length ? filtered.map(book => {
    const read = book.scenes.filter(scene => progress.visited.includes(scene.id)).length;
    return `<button class="book-card" data-book="${escape(book.id)}" aria-label="阅读${escape(book.title)}"><span class="book-card-index">${roman[BOOKS.indexOf(book)]}</span><span class="book-count">${read} / ${book.scenes.length} 幕</span><h3>${escape(book.title)}</h3><span class="english">${escape(book.englishTitle)}</span><p class="book-summary">${escape(book.summary)}</p><p class="book-tradition">${escape(book.tradition)}</p></button>`;
  }).join('') : '<p class="empty-state">没有找到这段故事。试试“以诺”“泥雀”或清空搜索。</p>';
}
function openSource() {
  const { book, scene } = currentScene(progress, BOOKS);
  $('sourceTitle').textContent = book.title;
  const sources = book.sourceIds.map(id => SOURCES.find(source => source.id === id));
  $('sourceContent').innerHTML = `<p class="source-meta">${escape(book.englishTitle)}<br>${escape(book.period)}</p><h3>所属传统</h3><p>${escape(book.tradition)}</p><h3>这一幕 · ${escape(scene.title)}</h3><p class="source-note">${escape(scene.reference)}</p><p>${escape(scene.insight)}</p><p class="source-note">画面、显影短句与旁白均为叙事改写；下列来源用于定位原典，不能把改写当作逐字引文。</p><h3>原典与参考版本</h3>${sources.map(source => `<div class="source-link"><a href="${escape(source.url)}" target="_blank" rel="noopener noreferrer">${escape(source.title)} ↗</a><p>${escape(source.edition)}<br>${escape(source.note)}</p></div>`).join('')}`;
  openDialog('sourceDialog');
}
function openJournal() { renderJournal(); openDialog('journalDialog'); }
function renderJournal() {
  $('visitedTab').setAttribute('aria-pressed', String(journalMode === 'visited'));
  $('bookmarksTab').setAttribute('aria-pressed', String(journalMode === 'bookmarks'));
  const ids = progress[journalMode];
  const entries = ids.map(id => { const book = BOOKS.find(item => item.scenes.some(scene => scene.id === id)); return { book, scene: book.scenes.find(scene => scene.id === id) }; });
  $('journalList').innerHTML = entries.length ? entries.toReversed().map(({ book, scene }) => `<button class="journal-entry" data-journal-book="${escape(book.id)}" data-journal-scene="${book.scenes.indexOf(scene)}"><small>${escape(book.title)} · ${escape(scene.reference)}</small><strong>${escape(scene.title)}</strong><p>${escape(scene.narrative)}</p></button>`).join('') : `<p class="empty-state">${journalMode === 'bookmarks' ? '还没有收藏的段落。阅读时，点“收藏”留下喜欢的一页。' : '你的书页还在等待显影。展开一卷，读过的故事就会留在这里。'}</p>`;
}

function setUtterance(text, visible = false) {
  $('utterance').innerHTML = Array.from(text).map(character => `<span class="ink-char${visible ? ' visible' : ''}">${escape(character)}</span>`).join('');
}
function settleReveal() {
  clearTimeout(revealTimer); breathing = false;
  document.body.classList.remove('revealing');
  $('holdButton').disabled = false;
  if (inReader) renderReader(false);
}
function startHold(origin, pointerId = null, key = null) {
  if (hold || breathing || document.querySelector('dialog[open]')) return;
  const cover = !inReader;
  const position = cover ? progress : nextPosition(progress, BOOKS);
  const text = position ? sceneAt(position).scene.invocation : '散落的书页，仍在等待下一位读者';
  hold = { started: performance.now(), amount: 0, origin, pointerId, key, text, cover, duration: Math.min(2800, 850 + Array.from(text).length * 72) };
  setUtterance(text);
  document.body.classList.add('charging');
  document.body.classList.toggle('cover-charging', cover);
  function tick(now) {
    if (!hold) return;
    hold.amount = Math.min(1, (now - hold.started) / hold.duration);
    world.setCharge(hold.amount);
    $('holdButton').style.setProperty('--charge', hold.amount);
    const visible = Math.ceil(Array.from(hold.text).length * hold.amount);
    [...$('utterance').children].forEach((element, index) => element.classList.toggle('visible', index < visible));
    if (hold.amount >= 1) {
      $('holdButton').classList.add('ready');
      $('holdLabel').textContent = '松手，让故事发生';
      $('coverHoldButton').textContent = '松手，让古卷展开';
    } else {
      $('holdLabel').textContent = '文字正在浮现…';
      if (cover) $('coverHoldButton').textContent = '古卷正在苏醒…';
      holdFrame = requestAnimationFrame(tick);
    }
  }
  holdFrame = requestAnimationFrame(tick);
}
function clearHold() {
  cancelAnimationFrame(holdFrame); hold = null; world.setCharge(0);
  document.body.classList.remove('charging', 'cover-charging');
  $('holdButton').classList.remove('ready');
  $('holdButton').style.setProperty('--charge', 0);
  $('coverHoldButton').textContent = '按住画面 · 让古卷苏醒';
}
function cancelHold() {
  skipAccessibleClick = false;
  if (!hold) return;
  clearHold();
  if (inReader) renderReader(false);
}
function releaseHold(origin, pointerId = null) {
  if (!hold || hold.origin !== origin || (origin === 'pointer' && hold.pointerId !== pointerId)) return;
  const complete = hold.amount >= 1;
  const cover = hold.cover;
  clearHold();
  if (inReader) renderReader(false);
  if (!complete) return;
  if (cover) {
    openReader();
    if (!progress.revealed) advance();
  } else advance();
}
function canHoldAt(target) {
  if (target.closest('dialog, [data-no-hold]')) return false;
  const control = target.closest('button, a, input, select, textarea, label');
  return !control || control.id === 'holdButton' || control.id === 'coverHoldButton';
}
function renderSound() {
  $('soundButton').setAttribute('aria-pressed', String(progress.sound));
  $('soundButton').setAttribute('aria-label', progress.sound ? '关闭声音' : '开启声音');
}
async function toggleSound() {
  const enabled = !progress.sound;
  const ok = await sound.setEnabled(enabled);
  progress.sound = enabled && ok; renderSound(); save();
  toast(ok ? progress.sound ? '声音已开启' : '声音已关闭' : '此浏览器暂时无法播放声音。');
  if (progress.sound) sound.chime(progress.sceneIndex);
}
async function toggleFullscreen() {
  try { if (document.fullscreenElement) await document.exitFullscreen(); else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen(); else toast('此浏览器不支持网页全屏，请使用窗口的全屏按钮。'); }
  catch { toast('当前浏览器未允许全屏，请使用窗口的全屏按钮。'); }
}

$('beginButton').addEventListener('click', openReader);
$('homeButton').addEventListener('click', home);
['libraryButton', 'browseButton', 'currentBookButton', 'finishLibraryButton'].forEach(id => $(id).addEventListener('click', openLibrary));
['journalButton', 'progressButton'].forEach(id => $(id).addEventListener('click', openJournal));
$('aboutButton').addEventListener('click', () => openDialog('aboutDialog'));
$('sourceButton').addEventListener('click', openSource);
$('nextButton').addEventListener('click', () => { cancelHold(); advance(); });
$('bookSearch').addEventListener('input', renderLibrary);
$('categoryTabs').addEventListener('click', event => { const button = event.target.closest('[data-category]'); if (button) { category = button.dataset.category; renderLibrary(); } });
$('bookList').addEventListener('click', event => { const button = event.target.closest('[data-book]'); if (button) selectScene(button.dataset.book); });
$('sceneDots').addEventListener('click', event => { const button = event.target.closest('[data-scene]'); if (button) selectScene(progress.bookId, Number(button.dataset.scene)); });
$('journalList').addEventListener('click', event => { const button = event.target.closest('[data-journal-book]'); if (button) selectScene(button.dataset.journalBook, Number(button.dataset.journalScene), true); });
$('bookmarkButton').addEventListener('click', () => { const { scene } = currentScene(progress, BOOKS); progress = toggleBookmark(progress, scene.id); renderReader(false); save(); });
$('visitedTab').addEventListener('click', () => { journalMode = 'visited'; renderJournal(); });
$('bookmarksTab').addEventListener('click', () => { journalMode = 'bookmarks'; renderJournal(); });
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('click', event => { if (event.target !== dialog) return; const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); }));
window.addEventListener('pointerdown', event => {
  if (event.button !== 0 || event.isPrimary === false || hold || !canHoldAt(event.target) || document.querySelector('dialog[open]')) return;
  event.preventDefault();
  world.setPointer(event.clientX, event.clientY);
  startHold('pointer', event.pointerId);
  if (hold) $('world').setPointerCapture(event.pointerId);
});
window.addEventListener('pointerup', event => releaseHold('pointer', event.pointerId));
window.addEventListener('pointercancel', cancelHold);
$('world').addEventListener('lostpointercapture', cancelHold);
$('world').addEventListener('contextmenu', event => event.preventDefault());
$('holdButton').addEventListener('contextmenu', event => event.preventDefault());
$('coverHoldButton').addEventListener('contextmenu', event => event.preventDefault());
$('holdButton').addEventListener('click', event => { if (!event.pointerType && event.detail === 0 && !skipAccessibleClick) advance(); });
$('coverHoldButton').addEventListener('click', event => { if (!event.pointerType && event.detail === 0 && !skipAccessibleClick) openReader(); });
window.addEventListener('blur', cancelHold);
window.addEventListener('pointermove', event => world.setPointer(event.clientX, event.clientY), { passive: true });
$('soundButton').addEventListener('click', toggleSound);
$('fullscreenButton').addEventListener('click', toggleFullscreen);
document.addEventListener('fullscreenchange', () => $('fullscreenButton').setAttribute('aria-label', document.fullscreenElement ? '退出全屏' : '进入全屏'));
$('motionSetting').addEventListener('change', () => { progress.readerMode = $('motionSetting').checked; settleReveal(); applyMotion(); save(); });
motionPreference.addEventListener('change', applyMotion);
document.addEventListener('visibilitychange', () => { if (document.hidden) { cancelHold(); sound.suspend(); } else sound.resume(); });
document.addEventListener('keydown', event => {
  if (event.isComposing || event.ctrlKey || event.metaKey || event.altKey || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName) || event.target.isContentEditable) return;
  if (event.code === 'Escape') { cancelHold(); return; }
  if (document.querySelector('dialog[open]')) return;
  if ((event.code === 'Space' || event.code === 'Enter') && (!event.target.closest('button,a') || (event.code === 'Space' && ['holdButton', 'coverHoldButton'].includes(event.target.id)))) {
    event.preventDefault(); if (!event.repeat) { skipAccessibleClick = true; startHold('keyboard', null, event.code); } return;
  }
  if (event.repeat) return;
  const action = { b: openLibrary, l: openJournal, m: toggleSound, f: toggleFullscreen, '?': () => openDialog('aboutDialog') }[event.key.toLowerCase()];
  if (action) { event.preventDefault(); action(); }
});
document.addEventListener('keyup', event => { if (event.code === 'Space' || event.code === 'Enter') { if (hold?.origin === 'keyboard' && hold.key === event.code) { event.preventDefault(); releaseHold('keyboard'); } setTimeout(() => { skipAccessibleClick = false; }, 0); } });

$('editorialNote').textContent = EDITORIAL_NOTE;
applyMotion(); renderSound(); renderProgress(); home();
