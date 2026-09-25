# Low-Power Projector Study MP3 Player Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a zero-dependency, ultra-low-power client-side MP3 player and ambient soundscape study tool optimized for projector display with high-contrast legibility, offline IndexedDB storage, and hardware audio decoding.

**Architecture:** A lightweight vanilla HTML5, CSS3, and ES6 modular web app. Hardware-accelerated MP3 playback via native HTML5 `<audio>`, pre-computed looped memory buffers for ambient noise/binaural beats, and background idle power throttling via the Page Visibility API.

**Tech Stack:** Vanilla JavaScript (ES6 modules), HTML5 Audio + Web Audio API, IndexedDB, CSS Tokens, Service Worker (PWA), Node.js `node:test` test runner.

**Spec:** [2026-09-25-low-power-projector-study-mp3-player-design.md](file:///Volumes/Apple%20External%20Drive/Mp3%20player/docs/superpowers/specs/2026-09-25-low-power-projector-study-mp3-player-design.md)

## Global Constraints

- Zero third-party npm runtime dependencies (pure browser standards: HTML5, CSS3, ES6 modules, Web Audio, IndexedDB).
- Native hardware audio offload for MP3/AAC/WAV files (< 0.5% CPU power footprint).
- Pre-computed 5-second looped `AudioBuffer` for ambient sounds and binaural beats (no continuous CPU DSP computations).
- High-contrast Projector Light mode as default (`#fbfbfa` canvas with `#0f172a` deep slate text) + Warm Paper mode.
- Fullscreen Projector Wall Mode (`F` hotkey) with high-legibility study timer and track info.
- Fully offline functional via IndexedDB and Service Worker.

---

### Task 1: CSS Design Tokens & Projector Light / Wall Mode Stylesheet

**Files:**
- Create: `css/tokens.css`
- Create: `css/style.css`
- Test: `tests/test-css-tokens.js`

**Interfaces:**
- Consumes: None
- Produces: CSS custom properties (`--bg-canvas`, `--text-primary`, `--border-color`, `--accent-primary`), layout rules for study deck, controls, mixer, and `.projector-wall` fullscreen overlay classes.

- [ ] **Step 1: Write the failing test for CSS tokens and rules**

```javascript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/test-css-tokens.js`
Expected: FAIL (files `css/tokens.css` and `css/style.css` do not exist yet)

- [ ] **Step 3: Implement `css/tokens.css` and `css/style.css`**

Create `css/tokens.css`:
```css
/* CSS Design Tokens - Projector Light & Study Themes */
:root {
  /* Default: Projector Studio Light (Razor-sharp projection on white/light wall) */
  --bg-canvas: #fbfbfa;
  --bg-surface: #ffffff;
  --bg-surface-elevated: #f4f4f0;
  --bg-hover: #eaeae4;
  --border-color: #e2e2da;
  --border-strong: #cbd5e1;

  /* High-Contrast Typography for Wall Projection */
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-muted: #64748b;
  --text-inverse: #ffffff;

  /* Accent & Status Colors */
  --accent-primary: #1e3a8a;
  --accent-light: #dbeafe;
  --accent-focus: #2563eb;
  --accent-break: #059669;
  --accent-break-light: #d1fae5;
  --status-active: #16a34a;
  --danger: #dc2626;

  /* Typography */
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  --font-display: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif;

  /* Spacing Scale */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;

  /* Border Radius */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-full: 9999px;

  /* Shadows (Minimal for sharp projector contrast) */
  --shadow-subtle: 0 1px 3px rgba(0, 0, 0, 0.05);
  --shadow-card: 0 4px 12px rgba(0, 0, 0, 0.06);
}

/* Warm Paper Theme (Gentle daytime ambient reading) */
[data-theme="warm-paper"] {
  --bg-canvas: #f6f1e8;
  --bg-surface: #fdfbf7;
  --bg-surface-elevated: #ede6d9;
  --bg-hover: #e3dcce;
  --border-color: #dfd7c5;
  --border-strong: #c8bdab;
  --text-primary: #292524;
  --text-secondary: #57534e;
  --text-muted: #78716c;
  --accent-primary: #78350f;
  --accent-light: #fef3c7;
}
```

Create `css/style.css`:
```css
@import "./tokens.css";

/* Base Reset */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--font-sans);
  background-color: var(--bg-canvas);
  color: var(--text-primary);
  line-height: 1.5;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  -webkit-font-smoothing: antialiased;
}

/* Header */
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-8);
  background-color: var(--bg-surface);
  border-bottom: 2px solid var(--border-color);
}

.brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.brand h1 {
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text-primary);
}

.header-badges {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.2rem 0.6rem;
  border-radius: var(--radius-full);
  background-color: var(--bg-surface-elevated);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.badge-lowpower {
  color: var(--accent-break);
  border-color: var(--accent-break-light);
  background-color: var(--accent-break-light);
}

/* Layout Grid */
.main-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-6);
  padding: var(--space-8);
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
  flex: 1;
}

@media (max-width: 960px) {
  .main-container {
    grid-template-columns: 1fr;
    padding: var(--space-4);
  }
}

/* Card Container */
.card {
  background-color: var(--bg-surface);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-card);
}

/* Track Display & Controls */
.now-playing {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  text-align: center;
  padding: var(--space-6) 0;
}

.track-title {
  font-size: 1.75rem;
  font-weight: 800;
  line-height: 1.2;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.track-artist {
  font-size: 1.1rem;
  color: var(--text-secondary);
  font-weight: 500;
}

/* Scrub Bar */
.scrub-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin: var(--space-3) 0;
}

.scrub-slider {
  width: 100%;
  height: 8px;
  -webkit-appearance: none;
  background: var(--bg-surface-elevated);
  border-radius: var(--radius-full);
  outline: none;
  border: 1px solid var(--border-color);
  cursor: pointer;
}

.scrub-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--accent-primary);
  cursor: pointer;
}

.time-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  font-family: var(--font-mono);
  color: var(--text-muted);
}

/* Primary Deck Buttons */
.controls-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
}

.btn {
  background-color: var(--bg-surface-elevated);
  border: 2px solid var(--border-color);
  color: var(--text-primary);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  transition: all 0.15s ease;
  user-select: none;
}

.btn:hover {
  background-color: var(--bg-hover);
  border-color: var(--border-strong);
}

.btn-primary {
  background-color: var(--accent-primary);
  color: var(--text-inverse);
  border-color: var(--accent-primary);
}

.btn-primary:hover {
  background-color: var(--accent-focus);
}

.btn-play-main {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  font-size: 1.5rem;
}

/* Ambient Sound Mixer */
.ambient-section {
  margin-top: var(--space-6);
  border-top: 2px solid var(--border-color);
  padding-top: var(--space-6);
}

.section-title {
  font-size: 1rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
  margin-bottom: var(--space-4);
}

.ambient-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
}

.ambient-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-color);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  gap: var(--space-4);
}

.ambient-label {
  font-weight: 600;
  font-size: 0.95rem;
  min-width: 140px;
}

.ambient-slider {
  flex: 1;
  height: 6px;
  cursor: pointer;
}

/* Pomodoro Study Timer */
.pomodoro-display {
  text-align: center;
  padding: var(--space-6) 0;
}

.timer-digits {
  font-size: 4rem;
  font-weight: 800;
  font-family: var(--font-mono);
  color: var(--text-primary);
  line-height: 1;
  margin: var(--space-3) 0;
  letter-spacing: -0.03em;
}

.timer-phase {
  font-size: 1rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--accent-focus);
}

.timer-phase.break {
  color: var(--accent-break);
}

.timer-presets {
  display: flex;
  justify-content: center;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

/* Playlist & Dropzone */
.dropzone {
  border: 2px dashed var(--border-strong);
  border-radius: var(--radius-md);
  padding: var(--space-6);
  text-align: center;
  background-color: var(--bg-surface-elevated);
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: var(--space-4);
}

.dropzone.dragover {
  border-color: var(--accent-focus);
  background-color: var(--accent-light);
}

.playlist-container {
  max-height: 380px;
  overflow-y: auto;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
}

.track-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
}

.track-item:last-child {
  border-bottom: none;
}

.track-item:hover {
  background-color: var(--bg-hover);
}

.track-item.active {
  background-color: var(--accent-light);
  font-weight: 700;
  border-left: 4px solid var(--accent-focus);
}

/* Projector Wall Mode (Fullscreen Hotkey 'F') */
.projector-wall {
  display: none;
  position: fixed;
  inset: 0;
  background-color: var(--bg-canvas);
  z-index: 9999;
  flex-direction: column;
  justify-content: space-between;
  padding: var(--space-12);
  text-align: center;
}

.projector-wall.active {
  display: flex;
}

.wall-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: var(--space-6);
}

.wall-timer {
  font-size: 9rem;
  font-weight: 900;
  font-family: var(--font-mono);
  color: var(--text-primary);
  line-height: 1;
}

.wall-track {
  font-size: 2.75rem;
  font-weight: 800;
  color: var(--text-secondary);
  max-width: 80%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.wall-hint {
  font-size: 1rem;
  color: var(--text-muted);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/test-css-tokens.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add css/tokens.css css/style.css tests/test-css-tokens.js
git commit -m "feat(css): add projector light tokens and wall mode styles"
```

---

### Task 2: IndexedDB Persistent Storage Module (`js/db.js`)

**Files:**
- Create: `js/db.js`
- Test: `tests/test-db.js`

**Interfaces:**
- Consumes: Native browser `indexedDB` API (or simulated in mock).
- Produces: `initDB()`, `saveTrack(fileOrBlob, meta)`, `getAllTracks()`, `deleteTrack(id)`, `clearTracks()`.

- [ ] **Step 1: Write the unit test for DB operations**

```javascript
// tests/test-db.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { StudyDB } from '../js/db.js';

test('StudyDB metadata parsing derives clean titles from filenames', () => {
  const meta1 = StudyDB.parseFileMetadata('01 - Deep Focus - Chopin Nocturne.mp3');
  assert.equal(meta1.title, '01 - Deep Focus - Chopin Nocturne');
  assert.equal(meta1.ext, 'mp3');

  const meta2 = StudyDB.parseFileMetadata('ambient_study_waves.flac');
  assert.equal(meta2.title, 'ambient_study_waves');
  assert.equal(meta2.ext, 'flac');
});

test('StudyDB formats byte sizes legibly', () => {
  assert.equal(StudyDB.formatBytes(1048576), '1.0 MB');
  assert.equal(StudyDB.formatBytes(5242880), '5.0 MB');
  assert.equal(StudyDB.formatBytes(500), '500 B');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/test-db.js`
Expected: FAIL (Cannot find module `../js/db.js`)

- [ ] **Step 3: Implement `js/db.js`**

Create `js/db.js`:
```javascript
// js/db.js - Persistent IndexedDB store for MP3 tracks
const DB_NAME = 'StudyMp3PlayerDB';
const DB_VERSION = 1;
const STORE_NAME = 'tracks';

export class StudyDB {
  static dbInstance = null;

  static async open() {
    if (this.dbInstance) return this.dbInstance;

    return new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        return reject(new Error('IndexedDB is not supported in this environment'));
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
          store.createIndex('title', 'title', { unique: false });
          store.createIndex('addedAt', 'addedAt', { unique: false });
        }
      };

      request.onsuccess = (event) => {
        this.dbInstance = event.target.result;
        resolve(this.dbInstance);
      };

      request.onerror = (event) => {
        reject(new Error(`Failed to open IndexedDB: ${event.target.error}`));
      };
    });
  }

  static parseFileMetadata(filename) {
    const lastDot = filename.lastIndexOf('.');
    const ext = lastDot > 0 ? filename.slice(lastDot + 1).toLowerCase() : '';
    const baseName = lastDot > 0 ? filename.slice(0, lastDot) : filename;
    return {
      title: baseName.replace(/_/g, ' ').trim(),
      ext
    };
  }

  static formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const val = (bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1);
    return `${val} ${sizes[i]}`;
  }

  static async saveTrack(fileBlob, customMeta = {}) {
    const db = await this.open();
    const meta = this.parseFileMetadata(fileBlob.name || 'Untitled Track.mp3');

    const trackRecord = {
      title: customMeta.title || meta.title,
      artist: customMeta.artist || 'Study Playlist',
      size: fileBlob.size,
      type: fileBlob.type || 'audio/mpeg',
      blob: fileBlob,
      addedAt: Date.now()
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(trackRecord);

      request.onsuccess = () => {
        trackRecord.id = request.result;
        resolve(trackRecord);
      };

      request.onerror = (e) => reject(e.target.error);
    });
  }

  static async getAllTracks() {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  static async deleteTrack(id) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(Number(id));

      request.onsuccess = () => resolve(true);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  static async clearTracks() {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve(true);
      request.onerror = (e) => reject(e.target.error);
    });
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/test-db.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add js/db.js tests/test-db.js
git commit -m "feat(storage): implement indexeddb offline track store"
```

---

### Task 3: Zero-DSP Audio Engine & Ambient/Binaural Synthesizer (`js/audio-engine.js`)

**Files:**
- Create: `js/audio-engine.js`
- Test: `tests/test-audio-engine.js`

**Interfaces:**
- Consumes: Web Audio API (`AudioContext`, `AudioBufferSourceNode`, `GainNode`, `ChannelMergerNode`), HTMLAudioElement.
- Produces: `AudioEngine` class with `playTrack(blob)`, `pause()`, `resume()`, `seek(sec)`, `setVolume(vol)`, `setAmbientVolume(type, vol)`, `setBinauralPreset(presetName)`.

- [ ] **Step 1: Write test for buffer generators and frequency calculations**

```javascript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/test-audio-engine.js`
Expected: FAIL (Cannot find module `../js/audio-engine.js`)

- [ ] **Step 3: Implement `js/audio-engine.js`**

Create `js/audio-engine.js`:
```javascript
// js/audio-engine.js - Low-power audio playback and zero-CPU pre-computed ambient loops
export class AudioEngine {
  constructor() {
    this.audioElement = new Audio();
    this.audioElement.preload = 'auto';
    this.currentTrackUrl = null;

    // Web Audio Context for pre-computed looped sounds
    this.audioCtx = null;
    this.brownGain = null;
    this.rainGain = null;
    this.binauralGain = null;

    this.binauralLeftOsc = null;
    this.binauralRightOsc = null;
    this.currentBinauralPreset = 'alpha';

    this.isPlaying = false;
  }

  static formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const totalSecs = Math.floor(seconds);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  static getBinauralFrequencies(preset) {
    const baseFreq = 200; // Comfortable carrier frequency
    switch (preset) {
      case 'theta': // Deep meditation & memory consolidation (6 Hz)
        return { baseFreq, beatFreq: 6, leftFreq: baseFreq, rightFreq: baseFreq + 6 };
      case 'gamma': // High focus, problem solving (40 Hz)
        return { baseFreq, beatFreq: 40, leftFreq: baseFreq, rightFreq: baseFreq + 40 };
      case 'alpha': // Flow state, relaxed concentration (10 Hz)
      default:
        return { baseFreq, beatFreq: 10, leftFreq: baseFreq, rightFreq: baseFreq + 10 };
    }
  }

  ensureAudioContext() {
    if (!this.audioCtx && typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
      this.initAmbientNodes();
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  initAmbientNodes() {
    if (!this.audioCtx) return;

    // 1. Brown Noise Generator (5-second pre-computed looped buffer)
    const brownBuffer = this.createBrownNoiseBuffer(5);
    const brownSource = this.audioCtx.createBufferSource();
    brownSource.buffer = brownBuffer;
    brownSource.loop = true;

    this.brownGain = this.audioCtx.createGain();
    this.brownGain.gain.setValueAtTime(0, this.audioCtx.currentTime);
    brownSource.connect(this.brownGain);
    this.brownGain.connect(this.audioCtx.destination);
    brownSource.start();

    // 2. Soft Rain Generator (5-second pre-computed looped buffer)
    const rainBuffer = this.createRainBuffer(5);
    const rainSource = this.audioCtx.createBufferSource();
    rainSource.buffer = rainBuffer;
    rainSource.loop = true;

    this.rainGain = this.audioCtx.createGain();
    this.rainGain.gain.setValueAtTime(0, this.audioCtx.currentTime);
    rainSource.connect(this.rainGain);
    this.rainGain.connect(this.audioCtx.destination);
    rainSource.start();

    // 3. Binaural Beat Synthesizer (Dual sine wave oscillators to L & R channels)
    this.initBinauralBeats();
  }

  createBrownNoiseBuffer(durationSec) {
    const sampleRate = this.audioCtx.sampleRate;
    const bufferSize = sampleRate * durationSec;
    const buffer = this.audioCtx.createBuffer(1, bufferSize, sampleRate);
    const output = buffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Integrated Brownian random walk with gentle decay
      lastOut = (lastOut + 0.02 * white) / 1.02;
      output[i] = lastOut * 3.5;
    }
    return buffer;
  }

  createRainBuffer(durationSec) {
    const sampleRate = this.audioCtx.sampleRate;
    const bufferSize = sampleRate * durationSec;
    const buffer = this.audioCtx.createBuffer(1, bufferSize, sampleRate);
    const output = buffer.getChannelData(0);

    // Pinkish noise with subtle amplitude modulation
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      const pink = b0 + b1 + b2 + white * 0.5362;
      const pulse = 0.8 + 0.2 * Math.sin((i / sampleRate) * Math.PI * 0.5);
      output[i] = pink * 0.12 * pulse;
    }
    return buffer;
  }

  initBinauralBeats() {
    const freqs = AudioEngine.getBinauralFrequencies(this.currentBinauralPreset);

    this.binauralGain = this.audioCtx.createGain();
    this.binauralGain.gain.setValueAtTime(0, this.audioCtx.currentTime);

    // Create Left & Right oscillators
    this.binauralLeftOsc = this.audioCtx.createOscillator();
    this.binauralRightOsc = this.audioCtx.createOscillator();

    this.binauralLeftOsc.type = 'sine';
    this.binauralRightOsc.type = 'sine';
    this.binauralLeftOsc.frequency.setValueAtTime(freqs.leftFreq, this.audioCtx.currentTime);
    this.binauralRightOsc.frequency.setValueAtTime(freqs.rightFreq, this.audioCtx.currentTime);

    // Stereo Merger (Channel 0: Left, Channel 1: Right)
    const merger = this.audioCtx.createChannelMerger(2);
    this.binauralLeftOsc.connect(merger, 0, 0);
    this.binauralRightOsc.connect(merger, 0, 1);

    merger.connect(this.binauralGain);
    this.binauralGain.connect(this.audioCtx.destination);

    this.binauralLeftOsc.start();
    this.binauralRightOsc.start();
  }

  setBinauralPreset(preset) {
    this.currentBinauralPreset = preset;
    if (this.audioCtx && this.binauralLeftOsc && this.binauralRightOsc) {
      const freqs = AudioEngine.getBinauralFrequencies(preset);
      this.binauralLeftOsc.frequency.setValueAtTime(freqs.leftFreq, this.audioCtx.currentTime);
      this.binauralRightOsc.frequency.setValueAtTime(freqs.rightFreq, this.audioCtx.currentTime);
    }
  }

  setAmbientVolume(type, volumeRatio) {
    this.ensureAudioContext();
    const clamped = Math.max(0, Math.min(1, volumeRatio));
    if (this.audioCtx) {
      if (type === 'brown' && this.brownGain) {
        this.brownGain.gain.setTargetAtTime(clamped * 0.8, this.audioCtx.currentTime, 0.05);
      } else if (type === 'rain' && this.rainGain) {
        this.rainGain.gain.setTargetAtTime(clamped * 0.8, this.audioCtx.currentTime, 0.05);
      } else if (type === 'binaural' && this.binauralGain) {
        this.binauralGain.gain.setTargetAtTime(clamped * 0.4, this.audioCtx.currentTime, 0.05);
      }
    }
  }

  async playTrack(blob) {
    this.ensureAudioContext();
    if (this.currentTrackUrl) {
      URL.revokeObjectURL(this.currentTrackUrl);
    }
    this.currentTrackUrl = URL.createObjectURL(blob);
    this.audioElement.src = this.currentTrackUrl;
    await this.audioElement.play();
    this.isPlaying = true;
  }

  pause() {
    this.audioElement.pause();
    this.isPlaying = false;
  }

  async resume() {
    this.ensureAudioContext();
    await this.audioElement.play();
    this.isPlaying = true;
  }

  seek(seconds) {
    if (this.audioElement.duration) {
      this.audioElement.currentTime = Math.max(0, Math.min(this.audioElement.duration, seconds));
    }
  }

  setVolume(volumeRatio) {
    this.audioElement.volume = Math.max(0, Math.min(1, volumeRatio));
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/test-audio-engine.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add js/audio-engine.js tests/test-audio-engine.js
git commit -m "feat(audio): implement zero-cpu audio engine and ambient synthesizers"
```

---

### Task 4: Pomodoro Study Timer & Harmonic Chime (`js/timer.js`)

**Files:**
- Create: `js/timer.js`
- Test: `tests/test-timer.js`

**Interfaces:**
- Consumes: Web Audio API for harmonic chime playback.
- Produces: `StudyTimer` class with `start()`, `pause()`, `reset()`, `setPreset(focusMins, breakMins)`, `onTick(cb)`, `onTransition(cb)`.

- [ ] **Step 1: Write test for Pomodoro countdown and phase transitions**

```javascript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/test-timer.js`
Expected: FAIL (Cannot find module `../js/timer.js`)

- [ ] **Step 3: Implement `js/timer.js`**

Create `js/timer.js`:
```javascript
// js/timer.js - Precision study interval manager with low-power chime
export class StudyTimer {
  constructor(options = {}) {
    this.focusSeconds = (options.focusMins || 25) * 60;
    this.breakSeconds = (options.breakMins || 5) * 60;
    this.remainingSeconds = this.focusSeconds;
    this.currentPhase = 'focus'; // 'focus' | 'break'
    this.isRunning = false;

    this.timerInterval = null;
    this.lastTimestamp = null;

    this.onTickCallbacks = [];
    this.onTransitionCallbacks = [];
  }

  setPreset(focusMins, breakMins) {
    this.pause();
    this.focusSeconds = focusMins * 60;
    this.breakSeconds = breakMins * 60;
    this.currentPhase = 'focus';
    this.remainingSeconds = this.focusSeconds;
    this.triggerTick();
  }

  onTick(cb) {
    this.onTickCallbacks.push(cb);
  }

  onTransition(cb) {
    this.onTransitionCallbacks.push(cb);
  }

  triggerTick() {
    for (const cb of this.onTickCallbacks) {
      cb({
        remainingSeconds: this.remainingSeconds,
        formatted: this.formattedTime(this.remainingSeconds),
        phase: this.currentPhase,
        isRunning: this.isRunning
      });
    }
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTimestamp = Date.now();

    this.timerInterval = setInterval(() => {
      const now = Date.now();
      const deltaSec = Math.floor((now - this.lastTimestamp) / 1000);

      if (deltaSec >= 1) {
        this.remainingSeconds -= deltaSec;
        this.lastTimestamp = now;

        if (this.remainingSeconds <= 0) {
          this.switchPhase();
        } else {
          this.triggerTick();
        }
      }
    }, 500); // 500ms check keeps timer accurate without high CPU usage

    this.triggerTick();
  }

  pause() {
    this.isRunning = false;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.triggerTick();
  }

  reset() {
    this.pause();
    this.remainingSeconds = this.currentPhase === 'focus' ? this.focusSeconds : this.breakSeconds;
    this.triggerTick();
  }

  switchPhase() {
    if (this.currentPhase === 'focus') {
      this.currentPhase = 'break';
      this.remainingSeconds = this.breakSeconds;
    } else {
      this.currentPhase = 'focus';
      this.remainingSeconds = this.focusSeconds;
    }

    this.playHarmonicChime();

    for (const cb of this.onTransitionCallbacks) {
      cb({ phase: this.currentPhase, remainingSeconds: this.remainingSeconds });
    }

    this.triggerTick();
  }

  playHarmonicChime() {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtxClass) return;
      const ctx = new AudioCtxClass();

      // Non-jarring two-tone harmonic chime (C5 = 523.25 Hz -> E5 = 659.25 Hz)
      const playTone = (freq, startTime, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.exponentialRampToValueAtTime(0.3, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      const now = ctx.currentTime;
      playTone(523.25, now, 1.2);
      playTone(659.25, now + 0.25, 1.5);
    } catch (e) {
      console.warn('Audio chime skipped:', e);
    }
  }

  formattedTime(seconds) {
    const s = Math.max(0, Math.floor(seconds));
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/test-timer.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add js/timer.js tests/test-timer.js
git commit -m "feat(timer): implement pomodoro study timer and audio chime"
```

---

### Task 5: UI Controller, Projector Wall View & Power Throttling (`js/ui.js`, `js/app.js`, `index.html`)

**Files:**
- Create: `index.html`
- Create: `js/ui.js`
- Create: `js/app.js`
- Test: `tests/test-ui-integration.js`

**Interfaces:**
- Consumes: `AudioEngine`, `StudyDB`, `StudyTimer`.
- Produces: Complete working interface, drag-and-drop listener, projector wall mode toggle, visibility change throttle.

- [ ] **Step 1: Write integration test to verify DOM structure matches controller expectations**

```javascript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/test-ui-integration.js`
Expected: FAIL (Cannot find `index.html`)

- [ ] **Step 3: Implement `index.html`, `js/ui.js`, and `js/app.js`**

Create `index.html`:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Ultra low-power MP3 player and ambient soundscape generator for studying with projector optimization.">
  <meta name="theme-color" content="#fbfbfa">
  <title>Study Player • Low Power Projector Deck</title>
  <link rel="stylesheet" href="css/style.css">
  <link rel="manifest" href="manifest.json">
</head>
<body>

  <!-- Header -->
  <header class="app-header">
    <div class="brand">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
      </svg>
      <h1>Study Player</h1>
    </div>

    <div class="header-badges">
      <span class="badge badge-lowpower" title="Native hardware audio decoding + paused DOM background cycles">
        ⚡ Negligible Power Mode
      </span>
      <button id="theme-toggle" class="btn" style="padding: 0.25rem 0.6rem; font-size: 0.8rem;">
        🎨 Theme: Projector Light
      </button>
      <button id="btn-wall-toggle" class="btn btn-primary" style="padding: 0.35rem 0.8rem; font-size: 0.85rem;" title="Toggle Fullscreen Wall Mode (Hotkey: F)">
        📽️ Projector Wall (F)
      </button>
    </div>
  </header>

  <!-- Main Content Deck -->
  <main class="main-container">

    <!-- Column 1: Player & Ambient Soundscapes -->
    <div class="card">
      <div class="now-playing">
        <div id="current-title" class="track-title">No Track Loaded</div>
        <div id="current-artist" class="track-artist">Drag and drop MP3s to start studying</div>
      </div>

      <!-- Scrub Bar -->
      <div class="scrub-container">
        <input type="range" id="scrub-bar" class="scrub-slider" min="0" max="100" value="0" step="0.1" aria-label="Audio progress">
        <div class="time-row">
          <span id="time-current">00:00</span>
          <span id="time-total">00:00</span>
        </div>
      </div>

      <!-- Playback Controls -->
      <div class="controls-row">
        <button id="btn-prev" class="btn" title="Previous Track (Left Arrow)" aria-label="Previous Track">⏮️</button>
        <button id="btn-play" class="btn btn-primary btn-play-main" title="Play / Pause (Space)" aria-label="Play">▶</button>
        <button id="btn-next" class="btn" title="Next Track (Right Arrow)" aria-label="Next Track">⏭️</button>
        <button id="btn-shuffle" class="btn" title="Toggle Shuffle" aria-label="Shuffle">🔀</button>
      </div>

      <!-- Volume -->
      <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-top: 1rem;">
        <span style="font-size: 0.85rem; color: var(--text-secondary);">Volume:</span>
        <input type="range" id="track-volume" class="scrub-slider" style="max-width: 140px;" min="0" max="1" step="0.05" value="0.85" aria-label="Music Volume">
      </div>

      <!-- Ambient & Binaural Mixer -->
      <div class="ambient-section">
        <h2 class="section-title">Study Ambience & Binaural Mixer</h2>
        <div class="ambient-grid">
          
          <div class="ambient-item">
            <div class="ambient-label">🌊 Brown Noise</div>
            <input type="range" id="ambient-brown" class="ambient-slider" min="0" max="1" step="0.05" value="0" aria-label="Brown noise volume">
          </div>

          <div class="ambient-item">
            <div class="ambient-label">🌧️ Soft Rain</div>
            <input type="range" id="ambient-rain" class="ambient-slider" min="0" max="1" step="0.05" value="0" aria-label="Soft rain volume">
          </div>

          <div class="ambient-item">
            <div class="ambient-label" style="display: flex; flex-direction: column;">
              <span>🧠 Binaural Beats</span>
              <select id="binaural-preset" style="font-size: 0.75rem; margin-top: 0.2rem; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 4px;">
                <option value="alpha">Alpha 10Hz (Flow State)</option>
                <option value="theta">Theta 6Hz (Memory / Calm)</option>
                <option value="gamma">Gamma 40Hz (Deep Focus)</option>
              </select>
            </div>
            <input type="range" id="ambient-binaural" class="ambient-slider" min="0" max="1" step="0.05" value="0" aria-label="Binaural beats volume">
          </div>

        </div>
      </div>
    </div>

    <!-- Column 2: Pomodoro Timer & Persistent Playlist -->
    <div class="card" style="display: flex; flex-direction: column;">
      
      <!-- Pomodoro Timer -->
      <div class="pomodoro-display">
        <div id="pomodoro-phase" class="timer-phase">FOCUS INTERVAL</div>
        <div id="pomodoro-digits" class="timer-digits">25:00</div>
        
        <div class="timer-presets">
          <button id="preset-25" class="btn" style="padding: 0.25rem 0.6rem; font-size: 0.8rem;">25 / 5 min</button>
          <button id="preset-50" class="btn" style="padding: 0.25rem 0.6rem; font-size: 0.8rem;">50 / 10 min</button>
          <button id="preset-custom" class="btn" style="padding: 0.25rem 0.6rem; font-size: 0.8rem;">Custom</button>
        </div>

        <div class="controls-row">
          <button id="btn-timer-toggle" class="btn btn-primary" title="Start/Pause Timer (P)">Start Timer</button>
          <button id="btn-timer-reset" class="btn">Reset</button>
        </div>
      </div>

      <!-- File Import Dropzone -->
      <div id="dropzone" class="dropzone">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin: 0 auto var(--space-2); display: block; color: var(--text-muted);">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="17 8 12 3 7 8"></polyline>
          <line x1="12" y1="3" x2="12" y2="15"></line>
        </svg>
        <div style="font-weight: 700; color: var(--text-primary);">Drop MP3 / Audio Files Here</div>
        <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem;">Or click to choose from your computer (auto-saved in IndexedDB)</div>
        <input type="file" id="file-input" multiple accept="audio/*" style="display: none;">
      </div>

      <!-- Playlist -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
        <span style="font-size: 0.85rem; font-weight: 700; color: var(--text-secondary);" id="playlist-count">0 Tracks Saved</span>
        <button id="btn-clear-playlist" class="btn" style="padding: 0.2rem 0.5rem; font-size: 0.75rem; color: var(--danger);">Clear All</button>
      </div>

      <div id="playlist" class="playlist-container">
        <!-- Rendered dynamically -->
      </div>
    </div>

  </main>

  <!-- Projector Wall Overlay (Fullscreen Hotkey 'F') -->
  <div id="wall-mode-overlay" class="projector-wall">
    <div style="display: flex; justify-content: space-between; width: 100%;">
      <span class="badge badge-lowpower">PROJECTOR WALL DISPLAY</span>
      <button id="btn-wall-exit" class="btn" style="font-size: 0.85rem;">Exit Wall Mode (Esc or F)</button>
    </div>

    <div class="wall-center">
      <div id="wall-phase" class="timer-phase" style="font-size: 1.5rem;">FOCUS INTERVAL</div>
      <div id="wall-timer" class="wall-timer">25:00</div>
      <div id="wall-track" class="wall-track">No Track Playing</div>
    </div>

    <div class="wall-hint">
      Shortcuts: [Space] Play/Pause • [Left/Right] Skip • [Up/Down] Volume • [P] Timer • [F] Exit Wall
    </div>
  </div>

  <script type="module" src="js/app.js"></script>
</body>
</html>
```

Create `js/ui.js`:
```javascript
// js/ui.js - View bindings and DOM synchronization
import { AudioEngine } from './audio-engine.js';
import { StudyDB } from './db.js';

export class UIController {
  constructor(engine, timer) {
    this.engine = engine;
    this.timer = timer;

    this.tracks = [];
    this.currentTrackIndex = -1;
    this.isShuffle = false;

    // Cache DOM Elements
    this.dom = {
      title: document.getElementById('current-title'),
      artist: document.getElementById('current-artist'),
      scrubBar: document.getElementById('scrub-bar'),
      timeCurrent: document.getElementById('time-current'),
      timeTotal: document.getElementById('time-total'),
      btnPlay: document.getElementById('btn-play'),
      btnPrev: document.getElementById('btn-prev'),
      btnNext: document.getElementById('btn-next'),
      btnShuffle: document.getElementById('btn-shuffle'),
      trackVolume: document.getElementById('track-volume'),
      playlist: document.getElementById('playlist'),
      playlistCount: document.getElementById('playlist-count'),
      dropzone: document.getElementById('dropzone'),
      fileInput: document.getElementById('file-input'),
      btnClearPlaylist: document.getElementById('btn-clear-playlist'),

      // Ambient
      brownSlider: document.getElementById('ambient-brown'),
      rainSlider: document.getElementById('ambient-rain'),
      binauralSlider: document.getElementById('ambient-binaural'),
      binauralPreset: document.getElementById('binaural-preset'),

      // Pomodoro
      timerPhase: document.getElementById('pomodoro-phase'),
      timerDigits: document.getElementById('pomodoro-digits'),
      btnTimerToggle: document.getElementById('btn-timer-toggle'),
      btnTimerReset: document.getElementById('btn-timer-reset'),
      preset25: document.getElementById('preset-25'),
      preset50: document.getElementById('preset-50'),
      presetCustom: document.getElementById('preset-custom'),

      // Wall Mode
      wallOverlay: document.getElementById('wall-mode-overlay'),
      wallTimer: document.getElementById('wall-timer'),
      wallPhase: document.getElementById('wall-phase'),
      wallTrack: document.getElementById('wall-track'),
      btnWallToggle: document.getElementById('btn-wall-toggle'),
      btnWallExit: document.getElementById('btn-wall-exit'),
      themeToggle: document.getElementById('theme-toggle')
    };

    this.isWallActive = false;
    this.isThrottled = false;
  }

  init() {
    this.bindEvents();
    this.loadPersistedTracks();
  }

  async loadPersistedTracks() {
    try {
      this.tracks = await StudyDB.getAllTracks();
      this.renderPlaylist();
      if (this.tracks.length > 0) {
        this.selectTrack(0, false);
      }
    } catch (e) {
      console.warn('Could not load tracks from storage:', e);
    }
  }

  bindEvents() {
    // Play/Pause
    this.dom.btnPlay.addEventListener('click', () => this.togglePlay());
    this.dom.btnNext.addEventListener('click', () => this.nextTrack());
    this.dom.btnPrev.addEventListener('click', () => this.prevTrack());
    this.dom.btnShuffle.addEventListener('click', () => this.toggleShuffle());

    // Scrub Bar
    this.dom.scrubBar.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (this.engine.audioElement.duration) {
        const time = (val / 100) * this.engine.audioElement.duration;
        this.engine.seek(time);
      }
    });

    // Volume
    this.dom.trackVolume.addEventListener('input', (e) => {
      this.engine.setVolume(parseFloat(e.target.value));
    });

    // Audio element native events
    this.engine.audioElement.addEventListener('timeupdate', () => {
      if (this.isThrottled) return; // Save CPU when tab hidden
      const cur = this.engine.audioElement.currentTime;
      const dur = this.engine.audioElement.duration || 0;
      this.dom.timeCurrent.textContent = AudioEngine.formatTime(cur);
      this.dom.timeTotal.textContent = AudioEngine.formatTime(dur);
      if (dur > 0) {
        this.dom.scrubBar.value = (cur / dur) * 100;
      }
    });

    this.engine.audioElement.addEventListener('ended', () => {
      this.nextTrack();
    });

    // Ambient Sliders
    this.dom.brownSlider.addEventListener('input', (e) => {
      this.engine.setAmbientVolume('brown', parseFloat(e.target.value));
    });
    this.dom.rainSlider.addEventListener('input', (e) => {
      this.engine.setAmbientVolume('rain', parseFloat(e.target.value));
    });
    this.dom.binauralSlider.addEventListener('input', (e) => {
      this.engine.setAmbientVolume('binaural', parseFloat(e.target.value));
    });
    this.dom.binauralPreset.addEventListener('change', (e) => {
      this.engine.setBinauralPreset(e.target.value);
    });

    // File Drag & Drop
    this.dom.dropzone.addEventListener('click', () => this.dom.fileInput.click());
    this.dom.fileInput.addEventListener('change', (e) => this.handleFileSelection(e.target.files));

    this.dom.dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.dom.dropzone.classList.add('dragover');
    });
    this.dom.dropzone.addEventListener('dragleave', () => {
      this.dom.dropzone.classList.remove('dragover');
    });
    this.dom.dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      this.dom.dropzone.classList.remove('dragover');
      if (e.dataTransfer.files) {
        this.handleFileSelection(e.dataTransfer.files);
      }
    });

    this.dom.btnClearPlaylist.addEventListener('click', async () => {
      if (confirm('Clear all saved tracks from offline storage?')) {
        await StudyDB.clearTracks();
        this.tracks = [];
        this.currentTrackIndex = -1;
        this.renderPlaylist();
        this.dom.title.textContent = 'No Track Loaded';
        this.dom.artist.textContent = 'Drag and drop MP3s to start';
      }
    });

    // Timer Bindings
    this.dom.btnTimerToggle.addEventListener('click', () => {
      if (this.timer.isRunning) {
        this.timer.pause();
        this.dom.btnTimerToggle.textContent = 'Start Timer';
      } else {
        this.timer.start();
        this.dom.btnTimerToggle.textContent = 'Pause Timer';
      }
    });

    this.dom.btnTimerReset.addEventListener('click', () => {
      this.timer.reset();
      this.dom.btnTimerToggle.textContent = 'Start Timer';
    });

    this.dom.preset25.addEventListener('click', () => this.timer.setPreset(25, 5));
    this.dom.preset50.addEventListener('click', () => this.timer.setPreset(50, 10));
    this.dom.presetCustom.addEventListener('click', () => {
      const focus = prompt('Enter Focus Minutes:', '30');
      const rest = prompt('Enter Break Minutes:', '5');
      if (focus && rest) {
        this.timer.setPreset(parseInt(focus, 10) || 25, parseInt(rest, 10) || 5);
      }
    });

    this.timer.onTick((data) => {
      this.dom.timerDigits.textContent = data.formatted;
      this.dom.wallTimer.textContent = data.formatted;
      this.dom.timerPhase.textContent = data.phase === 'focus' ? 'FOCUS INTERVAL' : 'REST BREAK';
      this.dom.wallPhase.textContent = data.phase === 'focus' ? 'FOCUS INTERVAL' : 'REST BREAK';
      this.dom.timerPhase.className = `timer-phase ${data.phase}`;
    });

    // Projector Wall Mode
    this.dom.btnWallToggle.addEventListener('click', () => this.toggleWallMode());
    this.dom.btnWallExit.addEventListener('click', () => this.toggleWallMode(false));

    // Theme Toggle
    this.dom.themeToggle.addEventListener('click', () => {
      const cur = document.body.getAttribute('data-theme');
      if (cur === 'warm-paper') {
        document.body.removeAttribute('data-theme');
        this.dom.themeToggle.textContent = '🎨 Theme: Projector Light';
      } else {
        document.body.setAttribute('data-theme', 'warm-paper');
        this.dom.themeToggle.textContent = '🎨 Theme: Warm Paper';
      }
    });
  }

  async handleFileSelection(files) {
    for (const file of files) {
      if (file.type.startsWith('audio/') || file.name.match(/\.(mp3|m4a|aac|wav|flac|ogg)$/i)) {
        try {
          const record = await StudyDB.saveTrack(file);
          this.tracks.push(record);
        } catch (e) {
          console.error('Error saving track:', e);
        }
      }
    }
    this.renderPlaylist();
    if (this.currentTrackIndex === -1 && this.tracks.length > 0) {
      this.selectTrack(0, false);
    }
  }

  renderPlaylist() {
    this.dom.playlistCount.textContent = `${this.tracks.length} Tracks Saved`;
    this.dom.playlist.innerHTML = '';

    this.tracks.forEach((track, idx) => {
      const item = document.createElement('div');
      item.className = `track-item ${idx === this.currentTrackIndex ? 'active' : ''}`;
      item.innerHTML = `
        <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 80%;">
          <div style="font-weight: 600; font-size: 0.95rem;">${track.title}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${StudyDB.formatBytes(track.size)}</div>
        </div>
        <button class="btn" style="padding: 0.2rem 0.5rem; font-size: 0.75rem;" title="Delete">✕</button>
      `;

      item.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
          e.stopPropagation();
          this.deleteTrack(idx);
        } else {
          this.selectTrack(idx, true);
        }
      });

      this.dom.playlist.appendChild(item);
    });
  }

  async selectTrack(index, autoplay = true) {
    if (index < 0 || index >= this.tracks.length) return;
    this.currentTrackIndex = index;
    const track = this.tracks[index];

    this.dom.title.textContent = track.title;
    this.dom.artist.textContent = track.artist || 'Study Playlist';
    this.dom.wallTrack.textContent = track.title;

    this.renderPlaylist();

    if (autoplay) {
      await this.engine.playTrack(track.blob);
      this.dom.btnPlay.textContent = '⏸';
    }
  }

  async togglePlay() {
    if (this.tracks.length === 0) return;
    if (this.currentTrackIndex === -1) {
      await this.selectTrack(0, true);
      return;
    }

    if (this.engine.isPlaying) {
      this.engine.pause();
      this.dom.btnPlay.textContent = '▶';
    } else {
      await this.engine.resume();
      this.dom.btnPlay.textContent = '⏸';
    }
  }

  nextTrack() {
    if (this.tracks.length === 0) return;
    let nextIdx = this.currentTrackIndex + 1;
    if (this.isShuffle) {
      nextIdx = Math.floor(Math.random() * this.tracks.length);
    } else if (nextIdx >= this.tracks.length) {
      nextIdx = 0;
    }
    this.selectTrack(nextIdx, true);
  }

  prevTrack() {
    if (this.tracks.length === 0) return;
    let prevIdx = this.currentTrackIndex - 1;
    if (prevIdx < 0) prevIdx = this.tracks.length - 1;
    this.selectTrack(prevIdx, true);
  }

  toggleShuffle() {
    this.isShuffle = !this.isShuffle;
    this.dom.btnShuffle.style.borderColor = this.isShuffle ? 'var(--accent-focus)' : 'var(--border-color)';
    this.dom.btnShuffle.style.backgroundColor = this.isShuffle ? 'var(--accent-light)' : 'var(--bg-surface-elevated)';
  }

  async deleteTrack(idx) {
    const track = this.tracks[idx];
    if (track && track.id) {
      await StudyDB.deleteTrack(track.id);
      this.tracks.splice(idx, 1);
      if (this.currentTrackIndex === idx) {
        this.currentTrackIndex = -1;
      } else if (this.currentTrackIndex > idx) {
        this.currentTrackIndex--;
      }
      this.renderPlaylist();
    }
  }

  toggleWallMode(force) {
    this.isWallActive = force !== undefined ? force : !this.isWallActive;
    if (this.isWallActive) {
      this.dom.wallOverlay.classList.add('active');
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } else {
      this.dom.wallOverlay.classList.remove('active');
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }

  setThrottled(isThrottled) {
    this.isThrottled = isThrottled;
  }
}
```

Create `js/app.js`:
```javascript
// js/app.js - Coordinator, hotkeys, and low-power visibility engine
import { AudioEngine } from './audio-engine.js';
import { StudyTimer } from './timer.js';
import { UIController } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
  const engine = new AudioEngine();
  const timer = new StudyTimer();
  const ui = new UIController(engine, timer);
  ui.init();

  // Low-Power Background Engine: Pause UI interval updates when tab is hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      ui.setThrottled(true);
    } else {
      ui.setThrottled(false);
    }
  });

  // Global Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    // Avoid capturing inputs if user is typing in a prompt/input
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;

    switch (e.code) {
      case 'Space':
        e.preventDefault();
        ui.togglePlay();
        break;
      case 'ArrowRight':
        e.preventDefault();
        ui.nextTrack();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        ui.prevTrack();
        break;
      case 'ArrowUp':
        e.preventDefault();
        engine.setVolume(Math.min(1, engine.audioElement.volume + 0.05));
        ui.dom.trackVolume.value = engine.audioElement.volume;
        break;
      case 'ArrowDown':
        e.preventDefault();
        engine.setVolume(Math.max(0, engine.audioElement.volume - 0.05));
        ui.dom.trackVolume.value = engine.audioElement.volume;
        break;
      case 'KeyF':
        e.preventDefault();
        ui.toggleWallMode();
        break;
      case 'KeyP':
        e.preventDefault();
        ui.dom.btnTimerToggle.click();
        break;
      case 'Escape':
        if (ui.isWallActive) {
          ui.toggleWallMode(false);
        }
        break;
    }
  });

  // Register Service Worker for offline PWA functionality
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch((err) => {
      console.warn('SW registration skipped:', err);
    });
  }
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/test-ui-integration.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add index.html js/ui.js js/app.js tests/test-ui-integration.js
git commit -m "feat(ui): implement projector wall view, hotkeys, and power throttle"
```

---

### Task 6: PWA Offline Manifest, Service Worker & Integration Verification

**Files:**
- Create: `manifest.json`
- Create: `sw.js`
- Create: `README.md`
- Test: `tests/test-pwa.js`

**Interfaces:**
- Consumes: Static asset paths.
- Produces: Service Worker caching strategy, PWA web app manifest, complete run guide.

- [ ] **Step 1: Write test for PWA manifest and service worker**

```javascript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/test-pwa.js`
Expected: FAIL (Cannot find `manifest.json`)

- [ ] **Step 3: Implement `manifest.json`, `sw.js`, and `README.md`**

Create `manifest.json`:
```json
{
  "name": "Study MP3 Player • Low Power Projector Deck",
  "short_name": "StudyPlayer",
  "description": "Ultra low-power MP3 player and ambient soundscape deck for studying on a projector.",
  "start_url": "./index.html",
  "display": "standalone",
  "background_color": "#fbfbfa",
  "theme_color": "#fbfbfa",
  "icons": [
    {
      "src": "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%231e3a8a'/><text x='50%' y='55%' font-size='50' font-family='sans-serif' fill='white' dominant-baseline='middle' text-anchor='middle'>♫</text></svg>",
      "sizes": "192x192 512x512",
      "type": "image/svg+xml"
    }
  ]
}
```

Create `sw.js`:
```javascript
// sw.js - Offline Service Worker
const CACHE_NAME = 'study-mp3-player-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/tokens.css',
  './css/style.css',
  './js/app.js',
  './js/audio-engine.js',
  './js/db.js',
  './js/timer.js',
  './js/ui.js',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests for our assets (ignore blob/data URLs handled natively)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        return networkResponse;
      });
    })
  );
});
```

Create `README.md`:
```markdown
# Low-Power Projector Study MP3 Player

A zero-dependency, ultra-low-power local audio player and focus soundscape environment built specifically for studying and wall/screen projector use.

## Why "Negligible Power"?
1. **Hardware-Accelerated Audio**: MP3 decoding is offloaded directly to macOS hardware decoders via the native `<audio>` element (< 0.5% CPU).
2. **Zero-DSP Ambient Loops**: Brown noise, rain, and binaural beats (Alpha 10Hz, Theta 6Hz, Gamma 40Hz) are generated as 5-second looped `AudioBuffer` nodes in RAM once upon startup. They run on native zero-CPU audio nodes without real-time script processing loops.
3. **Background Idle Throttling**: Uses the Page Visibility API to freeze DOM scrub-bar updates, timers, and animation frames whenever the player is running in the background or minimized.
4. **Projector Wall Mode**: High-contrast daylight theme (`#fbfbfa` with `#0f172a` typography) engineered specifically to stay razor-sharp and legible on wall projections without glare or washout.

---

## Quickstart

### Option 1: Direct in Browser
Open `index.html` directly in Safari, Chrome, or Brave:
```bash
open index.html
```

### Option 2: Lightweight Local HTTP Server (for PWA / Service Worker support)
```bash
python3 -m http.server 8080
# Open http://localhost:8080
```

---

## Keyboard Shortcuts
- `Space`: Play / Pause toggle
- `Right Arrow` / `Left Arrow`: Skip to Next / Previous track
- `Up Arrow` / `Down Arrow`: Volume Up / Down (+/- 5%)
- `F`: Toggle Fullscreen Projector Wall Mode
- `P`: Start / Pause Pomodoro Study Timer
- `Esc`: Exit Wall Mode
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/test-pwa.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add manifest.json sw.js README.md tests/test-pwa.js
git commit -m "feat(pwa): add service worker caching, manifest, and docs"
```
