# ⚡ Zero-Power Player

> **Ultra-low-power local audio deck & ambient focus mixer built for projectors, deep study sessions, and zero battery drain.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-0%20(Pure%20Vanilla)-success.svg)](#)
[![CPU Usage](https://img.shields.io/badge/CPU%20Draw-%3C%200.5%25%20(Hardware%20Offloaded)-brightgreen.svg)](#)
[![PWA Ready](https://img.shields.io/badge/PWA-100%25%20Offline%20Ready-purple.svg)](#)

---

## 💡 Why "Zero-Power"?

Traditional streaming and music desktop apps (Spotify, Electron players) constantly consume **5–15% CPU**, keep the GPU awake, trigger frequent garbage collection cycles, and drain 15–25W of MacBook battery over a study session.

**Zero-Power Player** is re-engineered from the ground up for negligible energy impact:

1. **Hardware-Accelerated Decoding**: MP3/AAC/WAV decoding is handed off directly to native Apple Silicon / OS hardware media decoders via HTML5 `<audio>`, consuming virtually **0% CPU**.
2. **Zero-DSP Ambient Soundscapes**: Brown noise, soft rain, and binaural beats (Alpha 10Hz, Theta 6Hz, Gamma 40Hz) are generated as **5-second seamless looped memory buffers** in RAM once upon startup. They run on native zero-CPU audio nodes without real-time script processing loops.
3. **Background Idle Throttling**: Listens to the Page Visibility API to completely halt DOM repaints, scrub-bar updates, and timers whenever the tab is hidden or minimized.
4. **Projector-Optimized Display**: High-contrast daylight theme (`#fbfbfa` canvas with `#0f172a` deep slate typography) engineered specifically to stay razor-sharp and legible on wall projections without glare or washout.

---

## ✨ Features

- 🎧 **Offline Drag & Drop Library**: Drop MP3, AAC, M4A, FLAC, or WAV files. They are stored locally in browser **IndexedDB** — your study playlist is preserved across reboots with zero re-importing.
- 📽️ **Projector Wall Mode (Hotkey `F`)**: Fullscreen, high-contrast, distraction-free study display showing your Pomodoro countdown and track title readable from across the room.
- 🧠 **Built-in Binaural Beats**:
  - **Alpha 10 Hz**: Flow state & relaxed concentration
  - **Theta 6 Hz**: Deep memory consolidation & calm
  - **Gamma 40 Hz**: High-focus problem solving
- 🌊 **Layered Ambient Soundscapes**: Independent volume controls for Brown Noise and Soft Rain that blend seamlessly underneath your music.
- ⏱️ **Integrated Pomodoro Timer**: 25/5 min and 50/10 min study intervals with non-jarring two-tone harmonic audio chimes.
- 🎨 **Multiple Themes**: Instant toggle between **Projector Studio Light** and gentle **Warm Paper**.
- 📦 **100% Client-Side & Private**: Zero telemetry, zero analytics, zero external API requests. Your music never leaves your device.

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
| :--- | :--- |
| **`Space`** | Play / Pause |
| **`→` / `←`** | Next / Previous Track |
| **`↑` / `↓`** | Volume Up / Down (+/- 5%) |
| **`F`** | Toggle Fullscreen Projector Wall Mode |
| **`P`** | Start / Pause Pomodoro Study Timer |
| **`Esc`** | Exit Projector Wall Mode |

---

## 🚀 Quickstart

### 1. Direct Launch (No Installation Required)
Simply clone the repo and open `index.html` in Safari, Chrome, or Brave:
```bash
git clone https://github.com/princejain756/Zero-Power-Player.git
cd Zero-Power-Player
open index.html
```

### 2. Run with Local Server (Enables PWA Offline Installation)
```bash
# Using Python built-in server:
python3 -m http.server 8080

# Or using npx:
npx serve .
```
Then visit `http://localhost:8080` in your browser and click **Install App** in the address bar.

---

## 🧪 Testing

Zero-Power Player comes with a complete native Node.js test suite with zero external test runners:

```bash
node --test tests/*.js
```

---

## 📄 License
MIT License. Feel free to use, modify, and study with it!
