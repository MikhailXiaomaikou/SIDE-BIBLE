import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { execFile, spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { Script } from 'node:vm';

const run = promisify(execFile);

test('a fresh standalone build embeds valid JavaScript and all three complete fonts for offline use', async t => {
  // Build a snapshot in isolation, so a stale checked-in HTML cannot hide a
  // broken build, and tests never replace a running preview or touch its save.
  const temporaryRoot = await mkdtemp(join(tmpdir(), 'side-bible-build-'));
  t.after(() => rm(temporaryRoot, { recursive: true, force: true }));
  await cp(new URL('../src/', import.meta.url), join(temporaryRoot, 'src'), { recursive: true });
  await mkdir(join(temporaryRoot, 'scripts'));
  await cp(new URL('../scripts/build.mjs', import.meta.url), join(temporaryRoot, 'scripts/build.mjs'));
  await run(process.execPath, ['scripts/build.mjs'], { cwd: temporaryRoot });
  const html = await readFile(join(temporaryRoot, 'index.html'), 'utf8');
  assert.match(html, /<html lang="zh-CN">/);
  assert.doesNotMatch(html, /<script[^>]+src=/);
  assert.doesNotMatch(html, /<link[^>]+rel="stylesheet"/);
  for (const name of ['ZhiMangXing', 'MaShanZheng', 'LXGWWenKai']) {
    const license = await readFile(join(temporaryRoot, `src/fonts/OFL-${name}.txt`), 'utf8');
    assert.ok(html.includes(license.replace(/[ \t]+$/gm, '')), `${name} copyright and license must travel with the standalone file`);
  }
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  assert.equal(scripts.length, 1);
  assert.doesNotThrow(() => new Script(scripts[0][1]));

  const styles = [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)].map(match => match[1]).join('\n');
  const fontFaces = [...styles.matchAll(/@font-face\s*\{([^}]+)\}/g)].map(match => match[1]);
  assert.equal(fontFaces.length, 3, 'the three reading fonts must remain available offline');
  for (const [id, family] of [['xing', 'Side Xing'], ['brush', 'Side Brush'], ['kai', 'Side Kai']]) {
    const face = fontFaces.find(rule => rule.includes(`font-family: '${family}'`));
    assert.ok(face, `missing embedded font family ${family}`);
    const encoded = face.match(/url\(['"]data:font\/woff2;base64,([A-Za-z0-9+/=]+)['"]\)/)?.[1];
    assert.ok(encoded, `${family} still depends on an external font file`);
    const embedded = Buffer.from(encoded, 'base64');
    const original = await readFile(join(temporaryRoot, `src/fonts/side-${id}.woff2`));
    assert.equal(embedded.subarray(0, 4).toString('ascii'), 'wOF2', `${family} is not a WOFF2 font`);
    assert.deepEqual(embedded, original, `${family} was truncated or changed by bundling`);
  }
  for (const [, url] of styles.matchAll(/url\(([^)]+)\)/g)) {
    assert.match(url.trim().replace(/^['"]|['"]$/g, ''), /^data:/, `external runtime asset: ${url}`);
  }
});

test('local preview serves the actual home page and modules and rejects missing files', async t => {
  const child = spawn(process.execPath, ['scripts/serve.mjs'], {
    cwd: new URL('../', import.meta.url), env: { ...process.env, PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe']
  });
  t.after(() => child.kill());
  const url = await new Promise((resolve, reject) => {
    let output = '';
    const timeout = setTimeout(() => reject(new Error('Preview did not start')), 5000);
    child.on('error', error => { clearTimeout(timeout); reject(error); });
    child.on('exit', code => { clearTimeout(timeout); reject(new Error(`Preview exited ${code}`)); });
    child.stdout.on('data', chunk => {
      output += chunk;
      const match = output.match(/http:\/\/127\.0\.0\.1:\d+/);
      if (match) { clearTimeout(timeout); resolve(match[0]); }
    });
  });
  const home = await fetch(url);
  assert.equal(home.status, 200);
  assert.match(home.headers.get('content-type'), /text\/html/);
  assert.match(await home.text(), /SIDE BIBLE/);
  const source = await fetch(`${url}/src/main.js`);
  assert.equal(source.status, 200);
  assert.match(source.headers.get('content-type'), /javascript/);
  assert.equal((await fetch(`${url}/does-not-exist`)).status, 404);
});
