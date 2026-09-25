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
