// tests/test-audio-engine.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { AudioEngine } from '../js/audio-engine.js';

test('AudioEngine formats seconds into MM:SS correctly', () => {
  assert.equal(AudioEngine.formatTime(0), '00:00');
  assert.equal(AudioEngine.formatTime(65), '01:05');
  assert.equal(AudioEngine.formatTime(600), '10:00');
  assert.equal(AudioEngine.formatTime(3665), '61:05');
});

test('Binaural beat presets calculate correct left and right ear frequencies', () => {
  const alpha = AudioEngine.getBinauralFrequencies('alpha');
  assert.equal(alpha.beatFreq, 10, 'Alpha beat frequency is 10 Hz');
  assert.equal(alpha.rightFreq - alpha.leftFreq, 10, 'Left and right channel offset is 10 Hz');

  const theta = AudioEngine.getBinauralFrequencies('theta');
  assert.equal(theta.beatFreq, 6, 'Theta beat frequency is 6 Hz');

  const gamma = AudioEngine.getBinauralFrequencies('gamma');
  assert.equal(gamma.beatFreq, 40, 'Gamma beat frequency is 40 Hz');
});
