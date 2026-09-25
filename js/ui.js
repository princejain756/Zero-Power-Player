// js/ui.js - View bindings, smooth scrubbing, modal management, and projector auto-hide
import { AudioEngine } from './audio-engine.js';
import { StudyDB } from './db.js';

export class UIController {
  constructor(engine, timer) {
    this.engine = engine;
    this.timer = timer;

    this.tracks = [];
    this.currentTrackIndex = -1;
    this.isShuffle = false;
    this.isScrubbing = false;
    this.isWallActive = false;
    this.isThrottled = false;
    this.wallCursorTimeout = null;

    if (typeof document !== 'undefined') {
      this.dom = {
        title: document.getElementById('current-title'),
        artist: document.getElementById('current-artist'),
        scrubBar: document.getElementById('scrub-bar'),
        timeCurrent: document.getElementById('time-current'),
        timeTotal: document.getElementById('time-total'),
        btnPlay: document.getElementById('btn-play'),
        iconPlay: document.getElementById('icon-play'),
        iconPause: document.getElementById('icon-pause'),
        playingEqualizer: document.getElementById('playing-equalizer'),
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

        // Theming & Modals
        themeToggle: document.getElementById('theme-toggle'),
        themeText: document.getElementById('theme-text'),
        btnHotkeys: document.getElementById('btn-hotkeys'),
        hotkeysModal: document.getElementById('hotkeys-modal'),
        btnHotkeysClose: document.getElementById('btn-hotkeys-close'),
        btnBinauralInfo: document.getElementById('btn-binaural-info'),
        binauralModal: document.getElementById('binaural-modal'),
        btnBinauralClose: document.getElementById('btn-binaural-close'),
        customModal: document.getElementById('custom-timer-modal'),
        customFocusInput: document.getElementById('custom-focus-input'),
        customBreakInput: document.getElementById('custom-break-input'),
        btnModalSave: document.getElementById('btn-modal-save'),
        btnModalCancel: document.getElementById('btn-modal-cancel'),
        toast: document.getElementById('toast-notification')
      };
    }
  }

  init() {
    this.restoreSettings();
    this.bindEvents();
    this.loadPersistedTracks();
  }

  restoreSettings() {
    try {
      // Restore Theme
      const savedTheme = localStorage.getItem('study_player_theme');
      if (savedTheme === 'warm-paper') {
        document.body.setAttribute('data-theme', 'warm-paper');
        if (this.dom.themeText) this.dom.themeText.textContent = 'Warm Paper';
      }

      // Restore Volume
      const savedVol = localStorage.getItem('study_player_volume');
      if (savedVol !== null && this.dom.trackVolume) {
        const vol = parseFloat(savedVol);
        this.dom.trackVolume.value = vol;
        this.engine.setVolume(vol);
      }
    } catch (e) {}
  }

  showToast(message) {
    if (!this.dom.toast) return;
    this.dom.toast.textContent = message;
    this.dom.toast.classList.add('show');
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.dom.toast.classList.remove('show');
    }, 2400);
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
    if (!this.dom) return;

    // Playback Controls
    this.dom.btnPlay.addEventListener('click', () => this.togglePlay());
    this.dom.btnNext.addEventListener('click', () => this.nextTrack());
    this.dom.btnPrev.addEventListener('click', () => this.prevTrack());
    this.dom.btnShuffle.addEventListener('click', () => this.toggleShuffle());

    // Smooth Scrub Bar with Drag Lock (Prevents stutter)
    const onScrubStart = () => { this.isScrubbing = true; };
    const onScrubEnd = () => {
      if (this.isScrubbing && this.engine.audioElement && !isNaN(this.engine.audioElement.duration)) {
        const val = parseFloat(this.dom.scrubBar.value);
        const time = (val / 100) * this.engine.audioElement.duration;
        this.engine.seek(time);
      }
      this.isScrubbing = false;
    };

    this.dom.scrubBar.addEventListener('mousedown', onScrubStart);
    this.dom.scrubBar.addEventListener('touchstart', onScrubStart, { passive: true });

    this.dom.scrubBar.addEventListener('input', (e) => {
      if (this.engine.audioElement && this.engine.audioElement.duration) {
        const val = parseFloat(e.target.value);
        const previewSec = (val / 100) * this.engine.audioElement.duration;
        this.dom.timeCurrent.textContent = AudioEngine.formatTime(previewSec);
      }
    });

    this.dom.scrubBar.addEventListener('change', onScrubEnd);
    this.dom.scrubBar.addEventListener('mouseup', onScrubEnd);
    this.dom.scrubBar.addEventListener('touchend', onScrubEnd);

    // Volume
    this.dom.trackVolume.addEventListener('input', (e) => {
      this.engine.setVolume(parseFloat(e.target.value));
    });

    // Native Audio Events
    if (this.engine.audioElement) {
      this.engine.audioElement.addEventListener('timeupdate', () => {
        if (this.isThrottled || this.isScrubbing) return;
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

      this.engine.audioElement.addEventListener('error', (e) => {
        console.error('Audio decode error:', e);
        this.showToast('⚠️ Unplayable audio file. Skipping...');
        this.nextTrack();
      });
    }

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
      this.showToast(`Binaural preset: ${e.target.value.toUpperCase()}`);
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
        this.engine.pause();
        this.updatePlayStateUI(false);
        await StudyDB.clearTracks();
        this.tracks = [];
        this.currentTrackIndex = -1;
        this.renderPlaylist();
        this.dom.title.textContent = 'No Track Loaded';
        this.dom.artist.textContent = 'Drag and drop MP3s to start';
        this.dom.wallTrack.textContent = 'No Track Playing';
        this.showToast('Library cleared');
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
      this.showToast('Timer reset');
    });

    this.dom.preset25.addEventListener('click', () => {
      this.timer.setPreset(25, 5);
      this.showToast('Interval set to 25 / 5 min');
    });
    this.dom.preset50.addEventListener('click', () => {
      this.timer.setPreset(50, 10);
      this.showToast('Interval set to 50 / 10 min');
    });

    // Custom Timer Modal
    this.dom.presetCustom.addEventListener('click', () => {
      this.dom.customModal.classList.add('active');
      this.dom.customFocusInput.focus();
    });

    this.dom.btnModalCancel.addEventListener('click', () => {
      this.dom.customModal.classList.remove('active');
    });

    this.dom.btnModalSave.addEventListener('click', () => {
      const focus = parseInt(this.dom.customFocusInput.value, 10) || 25;
      const rest = parseInt(this.dom.customBreakInput.value, 10) || 5;
      this.timer.setPreset(focus, rest);
      this.dom.customModal.classList.remove('active');
      this.showToast(`Custom interval: ${focus}m / ${rest}m`);
    });

    this.timer.onTick((data) => {
      this.dom.timerDigits.textContent = data.formatted;
      this.dom.wallTimer.textContent = data.formatted;
      this.dom.timerPhase.textContent = data.phase === 'focus' ? 'FOCUS INTERVAL' : 'REST BREAK';
      this.dom.wallPhase.textContent = data.phase === 'focus' ? 'FOCUS INTERVAL' : 'REST BREAK';
      this.dom.timerPhase.className = `timer-phase ${data.phase}`;
    });

    this.timer.onTransition((data) => {
      this.showToast(data.phase === 'break' ? '☕ Focus completed! Take a break.' : '🔔 Break finished! Back to focus.');
    });

    // Projector Wall Mode
    this.dom.btnWallToggle.addEventListener('click', () => this.toggleWallMode());
    this.dom.btnWallExit.addEventListener('click', () => this.toggleWallMode(false));

    // Mouse Activity Auto-Hide in Wall Mode
    this.dom.wallOverlay.addEventListener('mousemove', () => {
      if (!this.isWallActive) return;
      this.dom.wallOverlay.classList.remove('hide-cursor');
      clearTimeout(this.wallCursorTimeout);
      this.wallCursorTimeout = setTimeout(() => {
        if (this.isWallActive) {
          this.dom.wallOverlay.classList.add('hide-cursor');
        }
      }, 2500);
    });

    // Theme Toggle
    this.dom.themeToggle.addEventListener('click', () => {
      const cur = document.body.getAttribute('data-theme');
      if (cur === 'warm-paper') {
        document.body.removeAttribute('data-theme');
        this.dom.themeText.textContent = 'Projector Light';
        localStorage.setItem('study_player_theme', 'projector-light');
        this.showToast('Theme: Projector Studio Light');
      } else {
        document.body.setAttribute('data-theme', 'warm-paper');
        this.dom.themeText.textContent = 'Warm Paper';
        localStorage.setItem('study_player_theme', 'warm-paper');
        this.showToast('Theme: Warm Paper');
      }
    });

    // Hotkeys Modal
    this.dom.btnHotkeys.addEventListener('click', () => {
      this.dom.hotkeysModal.classList.add('active');
    });
    this.dom.btnHotkeysClose.addEventListener('click', () => {
      this.dom.hotkeysModal.classList.remove('active');
    });

    // Binaural Beats Science Modal
    if (this.dom.btnBinauralInfo) {
      this.dom.btnBinauralInfo.addEventListener('click', () => {
        this.dom.binauralModal.classList.add('active');
      });
    }
    if (this.dom.btnBinauralClose) {
      this.dom.btnBinauralClose.addEventListener('click', () => {
        this.dom.binauralModal.classList.remove('active');
      });
    }
  }

  async handleFileSelection(files) {
    let addedCount = 0;
    for (const file of files) {
      if (file.type.startsWith('audio/') || file.name.match(/\.(mp3|m4a|aac|wav|flac|ogg)$/i)) {
        try {
          const record = await StudyDB.saveTrack(file);
          this.tracks.push(record);
          addedCount++;
        } catch (e) {
          console.error('Error saving track:', e);
        }
      }
    }
    if (addedCount > 0) {
      this.renderPlaylist();
      this.showToast(`Added ${addedCount} track${addedCount > 1 ? 's' : ''}`);
      if (this.currentTrackIndex === -1 && this.tracks.length > 0) {
        this.selectTrack(0, false);
      }
    }
  }

  renderPlaylist() {
    if (!this.dom || !this.dom.playlist) return;
    this.dom.playlistCount.textContent = `${this.tracks.length} Tracks Saved`;
    this.dom.playlist.innerHTML = '';

    this.tracks.forEach((track, idx) => {
      const item = document.createElement('div');
      item.className = `track-item ${idx === this.currentTrackIndex ? 'active' : ''}`;
      item.dataset.index = idx;
      item.innerHTML = `
        <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 80%;">
          <div style="font-weight: 600; font-size: 0.95rem;">${track.title}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${StudyDB.formatBytes(track.size)}</div>
        </div>
        <button class="btn" style="padding: 0.2rem 0.5rem; font-size: 0.75rem;" title="Delete Track">✕</button>
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

  updatePlaylistActiveItem() {
    const items = this.dom.playlist.querySelectorAll('.track-item');
    items.forEach((item, idx) => {
      if (idx === this.currentTrackIndex) {
        item.classList.add('active');
        item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      } else {
        item.classList.remove('active');
      }
    });
  }

  async selectTrack(index, autoplay = true) {
    if (index < 0 || index >= this.tracks.length) return;
    this.currentTrackIndex = index;
    const track = this.tracks[index];

    this.dom.title.textContent = track.title;
    this.dom.artist.textContent = track.artist || 'Study Playlist';
    this.dom.wallTrack.textContent = track.title;

    this.updatePlaylistActiveItem();

    if (autoplay) {
      const success = await this.engine.playTrack(track.blob);
      this.updatePlayStateUI(success);
    }
  }

  updatePlayStateUI(isPlaying) {
    if (isPlaying) {
      if (this.dom.iconPlay) this.dom.iconPlay.style.display = 'none';
      if (this.dom.iconPause) this.dom.iconPause.style.display = 'block';
      if (this.dom.playingEqualizer) {
        this.dom.playingEqualizer.style.display = 'inline-flex';
        this.dom.playingEqualizer.classList.remove('paused');
      }
    } else {
      if (this.dom.iconPlay) this.dom.iconPlay.style.display = 'block';
      if (this.dom.iconPause) this.dom.iconPause.style.display = 'none';
      if (this.dom.playingEqualizer) {
        this.dom.playingEqualizer.classList.add('paused');
      }
    }
  }

  async togglePlay() {
    if (this.tracks.length === 0) {
      this.showToast('No tracks in library. Drop MP3s first!');
      return;
    }
    if (this.currentTrackIndex === -1) {
      await this.selectTrack(0, true);
      return;
    }

    if (this.engine.isPlaying) {
      this.engine.pause();
      this.updatePlayStateUI(false);
    } else {
      const ok = await this.engine.resume();
      this.updatePlayStateUI(ok);
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
    this.showToast(this.isShuffle ? '🔀 Shuffle On' : '➡️ Shuffle Off');
  }

  async deleteTrack(idx) {
    const track = this.tracks[idx];
    if (track && track.id) {
      await StudyDB.deleteTrack(track.id);
      const wasPlaying = this.currentTrackIndex === idx;
      this.tracks.splice(idx, 1);

      if (wasPlaying) {
        this.engine.pause();
        this.updatePlayStateUI(false);
        this.currentTrackIndex = -1;
        this.dom.title.textContent = 'No Track Loaded';
        this.dom.artist.textContent = 'Select a track to play';
      } else if (this.currentTrackIndex > idx) {
        this.currentTrackIndex--;
      }
      this.renderPlaylist();
      this.showToast('Track removed');
    }
  }

  toggleWallMode(force) {
    this.isWallActive = force !== undefined ? force : !this.isWallActive;
    if (this.isWallActive) {
      this.dom.wallOverlay.classList.add('active');
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
      this.showToast('Entered Projector Wall Mode');
    } else {
      this.dom.wallOverlay.classList.remove('active', 'hide-cursor');
      clearTimeout(this.wallCursorTimeout);
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }

  setThrottled(isThrottled) {
    this.isThrottled = isThrottled;
    if (this.dom.playingEqualizer) {
      if (isThrottled) {
        this.dom.playingEqualizer.classList.add('paused');
      } else if (this.engine.isPlaying) {
        this.dom.playingEqualizer.classList.remove('paused');
      }
    }
  }
}
