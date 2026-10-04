import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = name => readFile(resolve(root, name), 'utf8');
let html = await read('src/index.html');
let css = await read('src/style.css');
for (const font of ['xing', 'brush', 'kai']) {
  const data = await readFile(resolve(root, `src/fonts/side-${font}.woff2`));
  css = css.replace(`url('./fonts/side-${font}.woff2')`, `url('data:font/woff2;base64,${data.toString('base64')}')`);
}
const fontLicenses = await Promise.all(['ZhiMangXing', 'MaShanZheng', 'LXGWWenKai'].map(name => read(`src/fonts/OFL-${name}.txt`)));
// Keep the redistribution notices with the standalone file as well as the repo.
html = html.replace('</head>', () => `<!-- Embedded font copyright and licenses\n${fontLicenses.join('\n\n').replace(/[ \t]+$/gm, '')}\n-->\n</head>`);
const modules = await Promise.all(['content', 'state', 'world', 'audio', 'main'].map(name => read(`src/${name}.js`)));
const js = modules.map(source => source.replace(/^import\s+[^;]+;\s*$/gm, '').replace(/^export\s+/gm, '')).join('\n\n');
html = html.replace('<link rel="stylesheet" href="./style.css">', () => `<style>\n${css}\n</style>`);
html = html.replace('<script type="module" src="./main.js"></script>', () => `<script>\n(() => {\n'use strict';\n${js.replace(/<\/script/gi, '<\\/script')}\n})();\n</script>`);
await writeFile(resolve(root, 'index.html'), html);
console.log(`Built index.html — ${Math.round(Buffer.byteLength(html) / 1024)} KB, no network dependencies.`);
