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
        if (engine.audioElement) {
          engine.setVolume(Math.min(1, engine.audioElement.volume + 0.05));
          ui.dom.trackVolume.value = engine.audioElement.volume;
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (engine.audioElement) {
          engine.setVolume(Math.max(0, engine.audioElement.volume - 0.05));
          ui.dom.trackVolume.value = engine.audioElement.volume;
        }
        break;
      case 'KeyR':
        e.preventDefault();
        ui.cycleRepeat();
        break;
      case 'KeyS':
        e.preventDefault();
        ui.toggleShuffle();
        break;
      case 'KeyF':
        e.preventDefault();
        ui.toggleWallMode();
        break;
      case 'KeyP':
        e.preventDefault();
        ui.dom.btnTimerToggle.click();
        break;
      case 'Slash':
        if (e.shiftKey) { // '?' key
          e.preventDefault();
          ui.dom.hotkeysModal.classList.toggle('active');
        }
        break;
      case 'Escape':
        if (ui.dom.hotkeysModal && ui.dom.hotkeysModal.classList.contains('active')) {
          ui.dom.hotkeysModal.classList.remove('active');
        } else if (ui.dom.binauralModal && ui.dom.binauralModal.classList.contains('active')) {
          ui.dom.binauralModal.classList.remove('active');
        } else if (ui.dom.customModal && ui.dom.customModal.classList.contains('active')) {
          ui.dom.customModal.classList.remove('active');
        } else if (ui.isWallActive) {
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
