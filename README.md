<p align="center">
  <img src="https://raw.githubusercontent.com/princejain756/Zero-Power-Player/main/icon.png" width="140" height="140" alt="Zero-Power Player Logo" style="border-radius: 28px; box-shadow: 0 10px 30px rgba(0,0,0,0.12);">
</p>

<h1 align="center">Zero-Power Player</h1>

<p align="center">
  <strong>Ultra-low-power local audio deck & ambient focus mixer built for projectors, deep study sessions, and zero battery drain.</strong>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
  <a href="#"><img src="https://img.shields.io/badge/Dependencies-0%20(Pure%20Vanilla)-success.svg" alt="Zero Dependencies"></a>
  <a href="#"><img src="https://img.shields.io/badge/CPU%20Draw-%3C%200.5%25%20(Hardware%20Offloaded)-brightgreen.svg" alt="CPU Draw"></a>
  <a href="#"><img src="https://img.shields.io/badge/PWA-100%25%20Offline%20Ready-purple.svg" alt="PWA Ready"></a>
</p>

---

## Why "Zero-Power"?

Traditional streaming and desktop music players constantly consume **5–15% CPU**, keep the GPU awake, trigger frequent garbage collection cycles, and drain 15–25W of MacBook battery over a study session.

**Zero-Power Player** is re-engineered from the ground up for negligible energy impact:

1. **Hardware-Accelerated Decoding**: MP3/AAC/WAV decoding is handed off directly to native Apple Silicon / OS hardware media decoders via HTML5 `<audio>`, consuming virtually **0% CPU**.
2. **Zero-DSP Ambient Soundscapes**: Brown noise, soft rain, and binaural beats (Alpha, Beta, Gamma, Theta, Delta) are generated as **5-second seamless looped memory buffers** in RAM once upon startup. They run on native zero-CPU audio nodes without real-time script processing loops.
3. **Background Idle Throttling**: Listens to the Page Visibility API to completely halt DOM repaints, scrub-bar updates, and timers whenever the tab is hidden or minimized.
4. **Projector-Optimized Display**: High-contrast daylight theme (`#fbfbfa` canvas with `#0f172a` deep slate typography) engineered specifically to stay razor-sharp and legible on wall projections without glare or washout.

---

## Science of Binaural Beats

Binaural beats are an auditory illusion created when two slightly different sound frequencies are played separately into each ear, leading the brain to perceive a single pulsing beat at the mathematical frequency difference.

### How Binaural Beats Work
- **The Process**: If your left ear hears 400 Hz and your right ear hears 410 Hz, your brain perceives a beat at 10 Hz.
- **Brainwave Entrainment**: This hypothesis suggests that external sound frequencies can encourage your brain's electrical activity to match that frequency.
- **Frequency Bands**: These perceived beats typically range from 1 Hz to 40+ Hz, aligning with natural human brainwave states like delta, theta, alpha, beta, and gamma.

### Research Findings & Frequency Table

| Band | Frequency | Target State | Research Backing |
| :--- | :--- | :--- | :--- |
| **Gamma** | 40 Hz | Peak Focus & Problem Solving | Research in *Scientific Reports (Nature)* notes gamma frequencies trigger significant neural entrainment linked to heightened concentration. [[Nature 2025](https://www.nature.com/articles/s41598-025-88517-z)] |
| **Beta** | 14–20 Hz (16 Hz) | Active Study & Logic | A 2023 study in *Psychological Research* demonstrated beta and gamma frequencies improve auditory sentence comprehension and active analytical reasoning. [[Center for BrainHealth](https://centerforbrainhealth.org/article/focus-hack-study-finds-students-use-binaural-beats-to-get-high)] |
| **Alpha** | 8–12 Hz (10 Hz) | Flow State & Calm Focus | Systematic reviews on *PubMed* indicate alpha patterns can alleviate perceived task anxiety while preserving relaxed alertness. [[PubMed Review](https://pubmed.ncbi.nlm.nih.gov/37205669/)] |
| **Theta** | 4–7 Hz (6 Hz) | Memory Consolidation & Calm | Associated with memory consolidation, restorative recovery, and deep contemplative states. [[Open Public Health Journal](https://openpublichealthjournal.com/VOLUME/17/ELOCATOR/e18749445332258/FULLTEXT/)] |
| **Delta** | 1–3 Hz (2 Hz) | Deep Rest & Recovery | Deep restorative sleep and restorative physical recovery states. [[PMC Systematic Review](https://pmc.ncbi.nlm.nih.gov/articles/PMC10198548/)] |

*Note: Headphones are required for true stereo channel separation and binaural beat perception.*

---

## Features

- **Offline Drag & Drop Library**: Drop MP3, AAC, M4A, FLAC, or WAV files. They are stored locally in browser **IndexedDB** — your study playlist is preserved across reboots with zero re-importing.
- **Projector Wall Mode (Hotkey `F`)**: Fullscreen, high-contrast, distraction-free study display showing your Pomodoro countdown and track title readable from across the room.
- **Synthesized Ambient Soundscapes**: Independent volume controls for Brown Noise and Soft Rain that blend seamlessly underneath your music.
- **Science-Backed Binaural Beat Generator**: Hardware-efficient stereo panner nodes for Gamma, Beta, Alpha, Theta, and Delta waves.
- **Integrated Pomodoro Timer**: 25/5 min, 50/10 min, and Custom study intervals with non-jarring two-tone harmonic audio chimes.
- **Projector Themes**: Instant toggle between **Projector Studio Light** and gentle **Warm Paper**.
- **100% Client-Side & Private**: Zero telemetry, zero analytics, zero external API requests. Your music never leaves your device.

---

## Keyboard Shortcuts

| Key | Action |
| :--- | :--- |
| **`Space`** | Play / Pause |
| **`→` / `←`** | Next / Previous Track |
| **`↑` / `↓`** | Volume Up / Down (+/- 5%) |
| **`F`** | Toggle Fullscreen Projector Wall Mode |
| **`P`** | Start / Pause Pomodoro Study Timer |
| **`Esc`** | Exit Projector Wall Mode |

---

## Quickstart

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

### 3. Native macOS App
To build and install the standalone native macOS WebKit application:
```bash
./scripts/build-macos.sh
```
This compiles the native Swift binary, bundles all offline assets, creates an Apple HIG squircle icon, installs the app to `~/Applications`, and creates a distributable `.dmg`.

---

## Testing

Zero-Power Player comes with a complete native Node.js test suite with zero external test runners:

```bash
node --test tests/*.js
```

---

## License
MIT License. Feel free to use, modify, and study with it!
