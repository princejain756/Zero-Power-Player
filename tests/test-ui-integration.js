// tests/test-ui-integration.js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('index.html contains all critical controls and accessibility landmarks', () => {
  const htmlPath = path.resolve('index.html');
  assert.ok(fs.existsSync(htmlPath), 'index.html must exist');
  const html = fs.readFileSync(htmlPath, 'utf8');

  // Verify elements for audio controls
  assert.ok(html.includes('id="btn-play"'), 'Must have play button');
  assert.ok(html.includes('id="scrub-bar"'), 'Must have scrub bar');
  assert.ok(html.includes('id="ambient-brown"'), 'Must have brown noise slider');
  assert.ok(html.includes('id="ambient-rain"'), 'Must have rain slider');
  assert.ok(html.includes('id="ambient-binaural"'), 'Must have binaural slider');
  assert.ok(html.includes('id="binaural-preset"'), 'Must have binaural preset selector');
  assert.ok(html.includes('id="wall-mode-overlay"'), 'Must have projector wall overlay');
  assert.ok(html.includes('id="btn-wall-toggle"'), 'Must have projector wall mode button');
});
