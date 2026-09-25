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
