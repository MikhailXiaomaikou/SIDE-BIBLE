export const STORAGE_KEY = 'side-bible.progress.v1';

export function freshProgress(books) {
  return { version: 1, started: false, bookId: books[0].id, sceneIndex: 0,
    revealed: false, visited: [], bookmarks: [], sound: false, readerMode: false };
}

export function restoreProgress(value, books) {
  const initial = freshProgress(books);
  if (!value || value.version !== 1) return initial;
  const ids = new Set(books.flatMap(book => book.scenes.map(scene => scene.id)));
  const book = books.find(item => item.id === value.bookId) || books[0];
  const sceneIndex = Number.isInteger(value.sceneIndex) && value.sceneIndex >= 0 && value.sceneIndex < book.scenes.length ? value.sceneIndex : 0;
  const validIds = list => Array.isArray(list) ? [...new Set(list.filter(id => ids.has(id)))] : [];
  const visited = validIds(value.visited);
  return { ...initial, bookId: book.id, sceneIndex, started: value.started === true,
    revealed: value.revealed === true && visited.includes(book.scenes[sceneIndex].id),
    visited, bookmarks: validIds(value.bookmarks), sound: value.sound === true,
    readerMode: value.readerMode === true };
}

export function readProgress(storage, books) {
  try { return restoreProgress(JSON.parse(storage.getItem(STORAGE_KEY)), books); }
  catch { return freshProgress(books); }
}

export function writeProgress(storage, progress) {
  try { storage.setItem(STORAGE_KEY, JSON.stringify(progress)); return true; }
  catch { return false; }
}

export function currentScene(progress, books) {
  const book = books.find(item => item.id === progress.bookId);
  return { book, scene: book.scenes[progress.sceneIndex] };
}

// The next interaction reveals the selected scene, then advances one scene at a time.
export function nextPosition(progress, books) {
  if (!progress.revealed) return { bookId: progress.bookId, sceneIndex: progress.sceneIndex };
  const bookIndex = books.findIndex(book => book.id === progress.bookId);
  if (progress.sceneIndex + 1 < books[bookIndex].scenes.length) {
    return { bookId: progress.bookId, sceneIndex: progress.sceneIndex + 1 };
  }
  if (bookIndex + 1 < books.length) return { bookId: books[bookIndex + 1].id, sceneIndex: 0 };
  return null;
}

export function revealNext(progress, books) {
  const position = nextPosition(progress, books);
  if (!position) return { progress, finished: true };
  const scene = books.find(book => book.id === position.bookId).scenes[position.sceneIndex];
  return { progress: { ...progress, ...position, started: true, revealed: true,
    visited: [...new Set([...progress.visited, scene.id])] }, finished: false };
}

export function jumpTo(progress, books, bookId, sceneIndex = 0) {
  const book = books.find(item => item.id === bookId);
  if (!book || !Number.isInteger(sceneIndex) || sceneIndex < 0 || sceneIndex >= book.scenes.length) return progress;
  return { ...progress, bookId, sceneIndex, started: true, revealed: false };
}

export function toggleBookmark(progress, sceneId) {
  return { ...progress, bookmarks: progress.bookmarks.includes(sceneId)
    ? progress.bookmarks.filter(id => id !== sceneId) : [...progress.bookmarks, sceneId] };
}
