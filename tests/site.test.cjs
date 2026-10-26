const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('PWA manifest references local, existing icons and relative scope', () => {
  const manifest = JSON.parse(read('manifest.webmanifest'));
  assert.equal(manifest.start_url, './');
  assert.equal(manifest.scope, './');
  assert.equal(manifest.display, 'standalone');
  for (const icon of manifest.icons) {
    assert.ok(fs.existsSync(path.join(root, icon.src.replace(/^\.\//, ''))), `missing icon ${icon.src}`);
  }
});

test('all local scripts and styles linked from HTML exist', () => {
  const html = read('index.html');
  for (const match of html.matchAll(/(?:src|href)="\.\/([^"#?]+)"/g)) {
    const relative = match[1];
    if (/^(?:https?:)?\/\//.test(relative)) continue;
    assert.ok(fs.existsSync(path.join(root, relative)), `missing local asset ${relative}`);
  }
});

test('service worker caches only the app shell, not user/account content', () => {
  const sw = read('sw.js');
  assert.match(sw, /APP_SHELL/);
  assert.match(sw, /url\.origin !== self\.location\.origin/);
  assert.doesNotMatch(sw, /document\.cookie|localStorage|Authorization/);
});

test('GitHub Pages workflow runs app tests and uploads only _site', () => {
  const workflow = read('.github/workflows/pages.yml');
  assert.match(workflow, /npm run check/);
  assert.match(workflow, /path: _site/);
  assert.match(workflow, /actions\/deploy-pages@v4/);
});
