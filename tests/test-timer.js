// tests/test-timer.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { StudyTimer } from '../js/timer.js';

test('StudyTimer initializes with 25/5 defaults', () => {
  const timer = new StudyTimer({ focusMins: 25, breakMins: 5 });
  assert.equal(timer.remainingSeconds, 25 * 60);
  assert.equal(timer.currentPhase, 'focus');
  assert.equal(timer.isRunning, false);
});

test('StudyTimer formats MM:SS accurately', () => {
  const timer = new StudyTimer();
  assert.equal(timer.formattedTime(1500), '25:00');
  assert.equal(timer.formattedTime(299), '04:59');
  assert.equal(timer.formattedTime(7), '00:07');
});

test('StudyTimer changes presets correctly', () => {
  const timer = new StudyTimer();
  timer.setPreset(50, 10);
  assert.equal(timer.focusSeconds, 50 * 60);
  assert.equal(timer.breakSeconds, 10 * 60);
  assert.equal(timer.remainingSeconds, 50 * 60);
});
