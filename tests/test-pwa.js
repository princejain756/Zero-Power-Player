// tests/test-pwa.js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('manifest.json has correct standalone PWA configuration', () => {
  const manifestPath = path.resolve('manifest.json');
  assert.ok(fs.existsSync(manifestPath), 'manifest.json must exist');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  assert.equal(manifest.display, 'standalone');
  assert.ok(manifest.name.includes('Study'));
  assert.equal(manifest.start_url, './index.html');
});

test('Service worker sw.js contains cache install and fetch interception', () => {
  const swPath = path.resolve('sw.js');
  assert.ok(fs.existsSync(swPath), 'sw.js must exist');
  const swContent = fs.readFileSync(swPath, 'utf8');

  assert.ok(swContent.includes('addEventListener(\'install\''), 'Must handle install');
  assert.ok(swContent.includes('addEventListener(\'fetch\''), 'Must handle fetch');
});
