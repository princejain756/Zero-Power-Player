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

    // Cache DOM Elements safely if window is defined
    if (typeof document !== 'undefined') {
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
    }

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
    if (!this.dom) return;

    // Play/Pause
    this.dom.btnPlay.addEventListener('click', () => this.togglePlay());
    this.dom.btnNext.addEventListener('click', () => this.nextTrack());
    this.dom.btnPrev.addEventListener('click', () => this.prevTrack());
    this.dom.btnShuffle.addEventListener('click', () => this.toggleShuffle());

    // Scrub Bar
    this.dom.scrubBar.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (this.engine.audioElement && this.engine.audioElement.duration) {
        const time = (val / 100) * this.engine.audioElement.duration;
        this.engine.seek(time);
      }
    });

    // Volume
    this.dom.trackVolume.addEventListener('input', (e) => {
      this.engine.setVolume(parseFloat(e.target.value));
    });

    // Audio element native events
    if (this.engine.audioElement) {
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
    if (!this.dom || !this.dom.playlist) return;
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
