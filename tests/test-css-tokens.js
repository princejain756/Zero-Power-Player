// tests/test-css-tokens.js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('CSS tokens file contains projector high-contrast variables', () => {
  const tokensPath = path.resolve('css/tokens.css');
  assert.ok(fs.existsSync(tokensPath), 'css/tokens.css must exist');
  const tokensContent = fs.readFileSync(tokensPath, 'utf8');

  // Verify core theme tokens
  assert.ok(tokensContent.includes('--bg-canvas'), 'Must define --bg-canvas');
  assert.ok(tokensContent.includes('--text-primary'), 'Must define --text-primary');
  assert.ok(tokensContent.includes('--accent-primary'), 'Must define --accent-primary');
  assert.ok(tokensContent.includes('--font-display'), 'Must define --font-display');
  assert.ok(tokensContent.includes('[data-theme="warm-paper"]'), 'Must define warm-paper theme overrides');
});

test('CSS stylesheet contains projector wall mode and layout rules', () => {
  const stylePath = path.resolve('css/style.css');
  assert.ok(fs.existsSync(stylePath), 'css/style.css must exist');
  const styleContent = fs.readFileSync(stylePath, 'utf8');

  assert.ok(styleContent.includes('.projector-wall'), 'Must include .projector-wall styles');
  assert.ok(styleContent.includes('.ambient-slider'), 'Must include ambient mixer styles');
  assert.ok(styleContent.includes('.pomodoro-display'), 'Must include pomodoro display styles');
});
