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
