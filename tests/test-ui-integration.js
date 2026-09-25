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
  assert.ok(html.includes('id="btn-shuffle"'), 'Must have shuffle button');
  assert.ok(html.includes('id="btn-repeat"'), 'Must have repeat button');
  assert.ok(html.includes('id="repeat-badge"'), 'Must have repeat badge');
  assert.ok(html.includes('id="cover-art-container"'), 'Must have cover art container');
  assert.ok(html.includes('id="btn-toggle-cover"'), 'Must have toggle cover art button');
});

test('css layout prevents long song titles from blowing out grid columns', () => {
  const css = fs.readFileSync(path.resolve('css/style.css'), 'utf8');
  assert.ok(css.includes('minmax(0, 1fr) minmax(0, 1fr)'), 'main-container must use minmax(0, 1fr) to prevent blowout');
  assert.ok(css.includes('.track-title {'), 'must have .track-title');
  assert.ok(css.includes('text-overflow: ellipsis;'), 'must have text-overflow: ellipsis');
  assert.ok(css.includes('overflow-x: hidden;'), 'body must clip horizontal scroll');
});
