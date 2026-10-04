import test from 'node:test';
import assert from 'node:assert/strict';
import { BOOKS, CATEGORIES, EDITORIAL_NOTE, SOURCES } from '../src/content.js';
import { freshProgress, currentScene, revealNext, nextPosition } from '../src/state.js';

const supportedThemes = new Set([
  'watchers', 'garden', 'river', 'city', 'wisdom',
  'temple', 'birds', 'desert', 'dawn', 'tower',
]);

function requiredText(value, context) {
  assert.equal(typeof value, 'string', `${context} must be text`);
  assert.ok(value.trim().length > 0, `${context} must not be blank`);
}

function uniqueIds(items, context) {
  const ids = items.map(item => item.id);
  for (const id of ids) assert.match(id, /^[a-z][a-z0-9-]*$/, `${context}: invalid identifier`);
  assert.equal(new Set(ids).size, ids.length, `${context} has duplicate identifiers`);
}

test('the collection contains the agreed 12 works and exactly six scenes per work', () => {
  assert.equal(BOOKS.length, 12);
  assert.equal(BOOKS.flatMap(book => book.scenes).length, 72);
  for (const book of BOOKS) assert.equal(book.scenes.length, 6, book.id);
  for (const title of ['以诺一书', '禧年书', '多马福音']) {
    assert.ok(BOOKS.some(book => book.title === title), `the requested collection is missing ${title}`);
  }
});

test('book, scene, category and source identifiers can be used without collisions', () => {
  uniqueIds(BOOKS, 'books');
  uniqueIds(BOOKS.flatMap(book => book.scenes), 'scenes');
  uniqueIds(CATEGORIES, 'categories');
  uniqueIds(SOURCES, 'sources');
});

test('every book has reader-facing context, a display color and a working category', () => {
  const categories = new Set(CATEGORIES.map(category => category.id));
  for (const category of CATEGORIES) {
    requiredText(category.label, `${category.id}.label`);
    assert.ok(BOOKS.some(book => book.category === category.id), `empty category ${category.id}`);
  }
  for (const book of BOOKS) {
    for (const field of ['title', 'englishTitle', 'period', 'tradition', 'summary']) {
      requiredText(book[field], `${book.id}.${field}`);
    }
    assert.ok(categories.has(book.category), `${book.id} points to an absent category`);
    assert.match(book.color, /^#[0-9a-f]{6}$/i, `${book.id} has an invalid display color`);
  }
});

test('each scene has a distinct narrative, an invitation, a source location and editorial context', () => {
  const narratives = [];
  for (const book of BOOKS) {
    for (const scene of book.scenes) {
      for (const field of ['title', 'reference', 'invocation', 'narrative', 'insight']) {
        requiredText(scene[field], `${scene.id}.${field}`);
      }
      assert.match(scene.reference, /[0-9一二三四五六七八九十]/, `${scene.id} needs a chapter, saying or manuscript-page locator`);
      assert.ok(supportedThemes.has(scene.theme), `${scene.id} has an unsupported renderer theme: ${scene.theme}`);
      narratives.push(scene.narrative.trim());
    }
  }
  assert.equal(new Set(narratives).size, narratives.length, 'scenes must not reuse placeholder narratives');
});

test('every work links to at least one documented source and every source is actually referenced', () => {
  const sourceIds = new Set(SOURCES.map(source => source.id));
  const referencedIds = new Set();
  for (const book of BOOKS) {
    assert.ok(Array.isArray(book.sourceIds) && book.sourceIds.length > 0, `${book.id} has no source`);
    assert.equal(new Set(book.sourceIds).size, book.sourceIds.length, `${book.id} repeats a source`);
    for (const id of book.sourceIds) {
      assert.ok(sourceIds.has(id), `${book.id} refers to missing source ${id}`);
      referencedIds.add(id);
    }
  }
  for (const source of SOURCES) assert.ok(referencedIds.has(source.id), `unreferenced source ${source.id}`);
});

test('source links are complete HTTPS addresses with attribution and edition notes', () => {
  for (const source of SOURCES) {
    for (const field of ['title', 'edition', 'note']) requiredText(source[field], `${source.id}.${field}`);
    const url = new URL(source.url);
    assert.equal(url.protocol, 'https:', source.id);
    assert.ok(url.hostname.includes('.'), `${source.id} needs a public hostname`);
    assert.equal(url.username, '', source.id);
    assert.equal(url.password, '', source.id);
  }
});

test('the editorial note identifies the selection and distinguishes paraphrases from original wording', () => {
  requiredText(EDITORIAL_NOTE, 'editorial note');
  assert.match(EDITORIAL_NOTE, /12/);
  assert.match(EDITORIAL_NOTE, /72/);
  assert.match(EDITORIAL_NOTE, /原创转述|改写/);
  assert.match(EDITORIAL_NOTE, /传统/);
});

test('the actual collection can be read from beginning to end without a skipped or repeated scene', () => {
  const expectedIds = BOOKS.flatMap(book => book.scenes.map(scene => scene.id));
  let progress = freshProgress(BOOKS);
  const observedIds = [];
  for (let index = 0; index < 72; index++) {
    const result = revealNext(progress, BOOKS);
    assert.equal(result.finished, false, `unexpected end after ${index} scenes`);
    progress = result.progress;
    observedIds.push(currentScene(progress, BOOKS).scene.id);
  }
  assert.deepEqual(observedIds, expectedIds);
  assert.deepEqual(progress.visited, expectedIds);
  assert.equal(nextPosition(progress, BOOKS), null);
  assert.equal(revealNext(progress, BOOKS).finished, true);
});
