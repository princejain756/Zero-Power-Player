// js/audio-engine.js - Low-power audio playback and zero-CPU pre-computed ambient loops
export class AudioEngine {
  constructor() {
    this.audioElement = typeof Audio !== 'undefined' ? new Audio() : null;
    if (this.audioElement) {
      this.audioElement.preload = 'auto';
    }
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
    if (!this.audioElement) return false;
    if (this.currentTrackUrl) {
      URL.revokeObjectURL(this.currentTrackUrl);
      this.currentTrackUrl = null;
    }
    try {
      this.currentTrackUrl = URL.createObjectURL(blob);
      this.audioElement.src = this.currentTrackUrl;
      await this.audioElement.play();
      this.isPlaying = true;
      return true;
    } catch (err) {
      console.warn('Playback error or aborted:', err);
      this.isPlaying = false;
      return false;
    }
  }

  pause() {
    if (this.audioElement) {
      this.audioElement.pause();
    }
    this.isPlaying = false;
  }

  async resume() {
    this.ensureAudioContext();
    if (this.audioElement) {
      try {
        await this.audioElement.play();
        this.isPlaying = true;
        return true;
      } catch (err) {
        console.warn('Resume prevented by browser policy:', err);
        this.isPlaying = false;
        return false;
      }
    }
    return false;
  }

  seek(seconds) {
    if (this.audioElement && !isNaN(this.audioElement.duration)) {
      this.audioElement.currentTime = Math.max(0, Math.min(this.audioElement.duration, seconds));
    }
  }

  setVolume(volumeRatio) {
    if (this.audioElement) {
      const vol = Math.max(0, Math.min(1, volumeRatio));
      this.audioElement.volume = vol;
      try {
        localStorage.setItem('study_player_volume', vol.toString());
      } catch (e) {}
    }
  }
}
