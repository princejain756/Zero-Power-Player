# Low-Power Projector Study MP3 Player Design Specification

## 1. Overview
The Low-Power Projector Study MP3 Player is a zero-dependency, ultra-lightweight client-side web application and Progressive Web App (PWA) specifically optimized for study environments using a projector. It delivers near-zero CPU and battery consumption on macOS by delegating MP3 audio decoding directly to native hardware decoders and using pre-computed looped memory buffers for ambient soundscapes and binaural beats.

---

## 2. Core Constraints & Guarantees
- **Negligible Power & Battery Drain**:
  - Main audio playback via native HTML5 `<audio>` element leveraging macOS CoreAudio hardware decoding (< 0.5% CPU).
  - Ambient noise and binaural beats pre-computed into 5-second seamless loop `AudioBuffer` nodes (zero ongoing CPU DSP calculations).
  - Page Visibility API & idle throttling: when the browser tab is hidden or backgrounded, all DOM progress updates, timer redraws, and animation frames stop completely.
- **Projector-First Visual Design**:
  - High-contrast **Projector Light Mode** (`#fbfbfa` base with `#111827` high-contrast typography and subtle stone/slate borders) to ensure crisp legibility on wall projections without washout.
  - Optional **Warm Paper Mode** for glare-free daytime reading.
  - Dedicated **Projector Wall Mode** (Hotkey `F` / button) that transforms the screen into a distraction-free, large-format study display (large timer, track title, scrub bar, minimal serene controls).
- **Persistent Offline Storage**:
  - Audio files (MP3, AAC, M4A, WAV, FLAC) stored locally via browser `IndexedDB` (`mp3_player_store`). Files remain saved across reloads and browser sessions without needing re-importing.
- **Zero Build Tooling & Server Independence**:
  - Vanilla HTML5, modern CSS3 tokens, and ES6 modular JavaScript.
  - Works directly by opening `index.html` or via any local static server. Installable as a standalone PWA.

---

## 3. Architecture & Module Structure

```
/Volumes/Apple External Drive/Mp3 player/
├── index.html          # Semantic HTML5 layout, projector wall mode, focus deck
├── css/
│   ├── tokens.css      # CSS variables (Projector Light, Warm Paper, high-contrast typography)
│   └── style.css       # Clean study layout, projector fullscreen styles, controls
├── js/
│   ├── app.js          # Application coordinator, hotkeys, power-throttle visibility listener
│   ├── audio-engine.js # Low-power hardware audio manager + pre-computed ambient/binaural loops
│   ├── db.js           # IndexedDB wrapper for persistent offline MP3 track storage
│   ├── timer.js        # Pomodoro study interval manager with harmonic chime synthesis
│   └── ui.js           # High-efficiency DOM renderer & scrub bar updater
├── manifest.json       # PWA manifest (for standalone offline app use)
├── sw.js               # Service worker for 100% offline asset availability
└── README.md           # Quickstart guide & projector optimization tips
```

---

## 4. Subsystems & Component Specifications

### 4.1 Audio Engine (`js/audio-engine.js`)
- **Track Playback**:
  - Wraps a native `<audio>` element.
  - Streams audio tracks using `URL.createObjectURL(blob)`.
  - Supports Play, Pause, Seek, Volume, Track End event listener (auto-advance), Shuffle, and Repeat modes.
- **Ambient Sound Synthesizer**:
  - Pre-renders 5-second seamless looped `AudioBuffer` nodes in a single Web Audio `AudioContext`:
    1. **Brown Noise**: Filtered random walk noise producing deep, warm low-frequency focus sound.
    2. **Soft Rain**: Pink/white noise band-pass filtered with subtle droplet pulse modulation.
    3. **Binaural Beats**: Dual oscillator stereo nodes (Left: carrier frequency e.g. 200 Hz; Right: carrier + offset, e.g. 210 Hz for 10 Hz Alpha wave; 206 Hz for 6 Hz Theta; 240 Hz for 40 Hz Gamma).
  - Each generator connects to an independent `GainNode` controlled by its volume slider.
  - AudioContext is resumed lazily upon user interaction to comply with browser autoplay security policies.

### 4.2 Storage Engine (`js/db.js`)
- **Database**: IndexedDB named `StudyMp3PlayerDB`, version 1.
- **Object Store**: `tracks` with keyPath `id` (auto-increment) and indexes on `title`, `artist`, `addedAt`.
- **Operations**:
  - `addTracks(fileList)`: Reads files, extracts metadata (or derives from filename), stores `Blob`, returns array of stored track records.
  - `getAllTracks()`: Fetches all stored tracks sorted by order.
  - `deleteTrack(id)`: Removes track and revokes cached object URLs.
  - `clearAllTracks()`: Wipes object store.

### 4.3 Study Timer (`js/timer.js`)
- **State**: Focus (`focus`), Short Break (`shortBreak`), Long Break (`longBreak`), Idle (`idle`).
- **Interval Presets**:
  - 25 min Focus / 5 min Break
  - 50 min Focus / 10 min Break
  - Custom interval selector.
- **Audio Chime**:
  - Gentle, non-jarring harmonic chime generated via Web Audio API oscillators (two-tone chime: 523.25 Hz C5 -> 659.25 Hz E5 with smooth exponential gain decay).
- **Auto-Actions**:
  - Configurable option to automatically pause or lower music volume during rest breaks.

### 4.4 UI & Power Guard (`js/ui.js` & `js/app.js`)
- **View Modes**:
  - **Standard Study Deck**: Two-column responsive clean layout: Player Controls & Ambience Mixer on the left/top, Playlist & Study Timer on the right/bottom.
  - **Projector Wall Mode**: Maximized fullscreen view (`F` key) showing:
    - Large high-contrast track title and artist.
    - Large legible Pomodoro countdown timer.
    - Minimal progress bar and play/pause indicator.
    - Subtle toggle to reveal full controls when hovering near screen edge.
- **Power Throttling**:
  - Listens to `document.addEventListener('visibilitychange')`.
  - When document is `hidden`, stops interval updates of the progress scrub bar and UI timers.
  - Time updates resume instantaneously when document becomes `visible`.

---

## 5. Keyboard Navigation & Accessibility
- `Space`: Play / Pause toggle
- `ArrowRight`: Skip to next track
- `ArrowLeft`: Skip to previous track (or restart current track if > 3s in)
- `ArrowUp`: Increase volume (+5%)
- `ArrowDown`: Decrease volume (-5%)
- `F`: Toggle Projector Wall Mode (Fullscreen high-legibility display)
- `P`: Toggle Pomodoro Study Timer
- `M`: Master mute ambient/binaural soundscapes

---

## 6. Testing & Validation Plan
1. **Audio Decoding & Playback**: Verify playback of MP3, M4A, and WAV files via local drag-and-drop.
2. **IndexedDB Persistence**: Refresh browser and verify playlist tracks reload instantly without missing data.
3. **Power Profile & CPU Overhead**: Inspect Activity Monitor / Chrome Task Manager to confirm idle/playback CPU consumption is < 0.5% - 1.5%.
4. **Projector Visibility**: Verify readability and high-contrast projection legibility in both Projector Light and Warm Paper modes.
5. **Timer & Chime**: Verify 25/5 interval countdown, transition alert sound, and seamless audio backgrounding.
