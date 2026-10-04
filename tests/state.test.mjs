import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STORAGE_KEY, freshProgress, restoreProgress, readProgress, writeProgress,
  currentScene, nextPosition, revealNext, jumpTo, toggleBookmark,
} from '../src/state.js';

// A full-sized miniature catalogue keeps navigation tests independent of prose.
const books = Array.from({ length: 12 }, (_, bookIndex) => ({
  id: `book-${bookIndex + 1}`,
  scenes: Array.from({ length: 6 }, (_, sceneIndex) => ({
    id: `book-${bookIndex + 1}-scene-${sceneIndex + 1}`,
  })),
}));
const firstId = books[0].scenes[0].id;

function memoryStorage() {
  const values = new Map();
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

test('a new reader starts before the first reveal with independent empty lists', () => {
  const first = freshProgress(books);
  const second = freshProgress(books);
  assert.equal(first.started, false);
  assert.equal(first.revealed, false);
  assert.equal(currentScene(first, books).scene.id, firstId);
  assert.deepEqual(first.visited, []);
  assert.deepEqual(first.bookmarks, []);
  first.visited.push(firstId);
  assert.deepEqual(second.visited, []);
});

test('a saved reader resumes the selected scene, visited scenes, bookmarks and preferences', () => {
  const storage = memoryStorage();
  let progress = revealNext(freshProgress(books), books).progress;
  progress = jumpTo(progress, books, books[3].id, 4);
  progress = revealNext(progress, books).progress;
  progress = toggleBookmark(progress, currentScene(progress, books).scene.id);
  progress = { ...progress, sound: true, readerMode: true };
  assert.equal(writeProgress(storage, progress), true);
  assert.equal(typeof storage.getItem(STORAGE_KEY), 'string');
  assert.deepEqual(readProgress(storage, books), progress);
});

test('absent, malformed and unsupported saves recover to a usable initial state', async t => {
  for (const serialized of [null, '', '{broken', 'null', 'false', '12', '[]', '{}',
    JSON.stringify({ version: 0, started: true }),
    JSON.stringify({ version: 2, started: true }),
    JSON.stringify({ version: '1', started: true })]) {
    await t.test(String(serialized), () => {
      assert.deepEqual(readProgress({ getItem: () => serialized }, books), freshProgress(books));
    });
  }
});

test('a missing book and invalid scene indices cannot restore outside the catalogue', async t => {
  const missingBook = restoreProgress({ version: 1, bookId: 'removed-book', sceneIndex: 0 }, books);
  assert.equal(currentScene(missingBook, books).scene.id, firstId);
  for (const sceneIndex of [-1, 6, 100, 1.5, '2', null, undefined, Infinity, NaN]) {
    await t.test(String(sceneIndex), () => {
      const restored = restoreProgress({ version: 1, bookId: books[2].id, sceneIndex }, books);
      assert.equal(restored.bookId, books[2].id);
      assert.equal(currentScene(restored, books).scene.id, books[2].scenes[0].id);
    });
  }
});

test('restoring lists discards unknown identifiers and duplicates without altering saved input', () => {
  const otherId = books[5].scenes[2].id;
  const value = {
    version: 1, bookId: books[0].id, sceneIndex: 0, revealed: true,
    visited: [firstId, 'deleted-scene', firstId, null, 2, {}, otherId],
    bookmarks: [otherId, false, otherId, firstId, 'unknown'],
  };
  const before = structuredClone(value);
  const progress = restoreProgress(value, books);
  assert.deepEqual(progress.visited, [firstId, otherId]);
  assert.deepEqual(progress.bookmarks, [otherId, firstId]);
  assert.equal(progress.revealed, true);
  assert.deepEqual(value, before);
});

test('unexpected list types and truthy non-booleans do not corrupt a restored reader', async t => {
  for (const list of [undefined, null, true, 42, firstId, {}, { length: 1, 0: firstId }]) {
    await t.test(JSON.stringify(list) ?? 'undefined', () => {
      const progress = restoreProgress({
        version: 1, visited: list, bookmarks: list,
        started: 'true', revealed: 'true', sound: 1, readerMode: {},
      }, books);
      assert.deepEqual(progress.visited, []);
      assert.deepEqual(progress.bookmarks, []);
      assert.equal(progress.started, false);
      assert.equal(progress.revealed, false);
      assert.equal(progress.sound, false);
      assert.equal(progress.readerMode, false);
    });
  }
});

test('a save cannot claim an unread selected scene is already revealed', () => {
  const progress = restoreProgress({
    version: 1, bookId: books[1].id, sceneIndex: 3,
    revealed: true, visited: [firstId],
  }, books);
  assert.equal(progress.revealed, false);
  const result = revealNext(progress, books);
  assert.equal(currentScene(result.progress, books).scene.id, books[1].scenes[3].id);
  assert.equal(result.progress.visited.length, 2);
});

test('denied storage still permits reading and reports a failed save without throwing', () => {
  const blocked = {
    getItem() { throw new Error('Storage is unavailable'); },
    setItem() { throw new Error('Storage is read only'); },
  };
  const progress = revealNext(readProgress(blocked, books), books).progress;
  assert.equal(progress.started, true);
  assert.deepEqual(progress.visited, [firstId]);
  assert.equal(writeProgress(blocked, progress), false);
  assert.equal(writeProgress(null, progress), false);
  assert.deepEqual(readProgress(null, books), freshProgress(books));
});

test('six reveals finish one book and the next reveal opens the following book', () => {
  let progress = freshProgress(books);
  for (let index = 0; index < 6; index++) progress = revealNext(progress, books).progress;
  assert.equal(progress.bookId, books[0].id);
  assert.equal(progress.sceneIndex, 5);
  assert.deepEqual(nextPosition(progress, books), { bookId: books[1].id, sceneIndex: 0 });
  progress = revealNext(progress, books).progress;
  assert.equal(currentScene(progress, books).scene.id, books[1].scenes[0].id);
  assert.equal(progress.visited.length, 7);
});

test('exactly 72 reveals visit the entire catalogue in order and stop at the last scene', () => {
  const expectedIds = books.flatMap(book => book.scenes.map(scene => scene.id));
  let progress = freshProgress(books);
  for (let index = 0; index < expectedIds.length; index++) {
    const result = revealNext(progress, books);
    assert.equal(result.finished, false, `scene ${index + 1} must be readable`);
    progress = result.progress;
    assert.equal(currentScene(progress, books).scene.id, expectedIds[index]);
    assert.equal(progress.visited.length, index + 1);
  }
  assert.deepEqual(progress.visited, expectedIds);
  assert.equal(nextPosition(progress, books), null);
  for (let attempt = 0; attempt < 3; attempt++) {
    const end = revealNext(progress, books);
    assert.equal(end.finished, true);
    assert.deepEqual(end.progress, progress);
  }
});

test('jumping selects an unread scene without counting it as read, and reveals that exact scene next', () => {
  const original = freshProgress(books);
  const selected = jumpTo(original, books, books[8].id, 3);
  assert.equal(selected.started, true);
  assert.equal(selected.revealed, false);
  assert.deepEqual(selected.visited, []);
  assert.deepEqual(nextPosition(selected, books), { bookId: books[8].id, sceneIndex: 3 });
  assert.equal(original.started, false);
  const revealed = revealNext(selected, books).progress;
  assert.equal(currentScene(revealed, books).scene.id, books[8].scenes[3].id);
  assert.deepEqual(revealed.visited, [books[8].scenes[3].id]);
});

test('revisiting scenes never inflates the read count', () => {
  let progress = revealNext(freshProgress(books), books).progress;
  progress = revealNext(progress, books).progress;
  const visitedBefore = [...progress.visited];
  progress = jumpTo(progress, books, books[0].id, 0);
  progress = revealNext(progress, books).progress;
  progress = revealNext(progress, books).progress;
  assert.deepEqual(progress.visited, visitedBefore);
});

test('invalid jumps preserve the current position and reading history', () => {
  const progress = revealNext(freshProgress(books), books).progress;
  const invalidTargets = [['missing', 0], [books[0].id, -1], [books[0].id, 6],
    [books[0].id, 1.5], [books[0].id, '1'], [books[0].id, NaN]];
  for (const [bookId, index] of invalidTargets) {
    assert.deepEqual(jumpTo(progress, books, bookId, index), progress);
  }
});

test('bookmarks toggle independently from reading progress and survive reload', () => {
  const storage = memoryStorage();
  const original = freshProgress(books);
  const otherId = books[1].scenes[4].id;
  let progress = toggleBookmark(original, firstId);
  progress = toggleBookmark(progress, otherId);
  progress = toggleBookmark(progress, firstId);
  assert.deepEqual(progress.bookmarks, [otherId]);
  assert.deepEqual(progress.visited, []);
  assert.deepEqual(original.bookmarks, []);
  writeProgress(storage, progress);
  assert.deepEqual(readProgress(storage, books).bookmarks, [otherId]);
  progress = toggleBookmark(progress, otherId);
  assert.deepEqual(progress.bookmarks, []);
});
