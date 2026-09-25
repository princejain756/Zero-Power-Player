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

  static async extractCoverArt(fileBlob) {
    if (!fileBlob || typeof fileBlob.slice !== 'function') return null;
    try {
      const maxRead = Math.min(fileBlob.size, 2 * 1024 * 1024);
      const headerBuffer = await fileBlob.slice(0, maxRead).arrayBuffer();
      const bytes = new Uint8Array(headerBuffer);

      // 1. Check ID3v2 APIC tag
      if (bytes.length >= 10 && bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
        const majorVersion = bytes[3];
        const tagSize = ((bytes[6] & 0x7f) << 21) | ((bytes[7] & 0x7f) << 14) | ((bytes[8] & 0x7f) << 7) | (bytes[9] & 0x7f);
        let offset = 10;
        const limit = Math.min(bytes.length, 10 + tagSize);

        while (offset + 10 < limit) {
          const frameId = String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]);
          if (bytes[offset] === 0) break;

          let frameSize = 0;
          if (majorVersion === 4) {
            frameSize = ((bytes[offset + 4] & 0x7f) << 21) | ((bytes[offset + 5] & 0x7f) << 14) | ((bytes[offset + 6] & 0x7f) << 7) | (bytes[offset + 7] & 0x7f);
          } else {
            frameSize = (bytes[offset + 4] << 24) | (bytes[offset + 5] << 16) | (bytes[offset + 6] << 8) | bytes[offset + 7];
          }

          if (frameSize <= 0 || offset + 10 + frameSize > limit) break;

          if (frameId === 'APIC') {
            const frameData = bytes.subarray(offset + 10, offset + 10 + frameSize);
            const encoding = frameData[0];
            let pos = 1;

            let mimeType = '';
            while (pos < frameData.length && frameData[pos] !== 0) {
              mimeType += String.fromCharCode(frameData[pos]);
              pos++;
            }
            pos++;
            if (!mimeType || mimeType === '-->') mimeType = 'image/jpeg';

            pos++; // Picture type

            // Skip description
            if (encoding === 1 || encoding === 2) {
              while (pos + 1 < frameData.length && !(frameData[pos] === 0 && frameData[pos + 1] === 0)) {
                pos += 2;
              }
              pos += 2;
            } else {
              while (pos < frameData.length && frameData[pos] !== 0) {
                pos++;
              }
              pos++;
            }

            if (pos < frameData.length) {
              const imgBytes = frameData.subarray(pos);
              return new Blob([imgBytes], { type: mimeType });
            }
          }

          offset += 10 + frameSize;
        }
      }

      // 2. Check MP4 / M4A covr atom
      for (let i = 0; i < bytes.length - 16; i++) {
        if (bytes[i] === 0x63 && bytes[i + 1] === 0x6f && bytes[i + 2] === 0x76 && bytes[i + 3] === 0x72) {
          for (let j = i + 4; j < Math.min(bytes.length - 16, i + 64); j++) {
            if (bytes[j] === 0x64 && bytes[j + 1] === 0x61 && bytes[j + 2] === 0x74 && bytes[j + 3] === 0x61) {
              const dataSize = (bytes[j - 4] << 24) | (bytes[j - 3] << 16) | (bytes[j - 2] << 8) | bytes[j - 1];
              const dataType = (bytes[j + 4] << 24) | (bytes[j + 5] << 16) | (bytes[j + 6] << 8) | bytes[j + 7];
              const mime = dataType === 14 ? 'image/png' : 'image/jpeg';
              const imgStart = j + 12;
              const imgEnd = Math.min(bytes.length, j - 4 + dataSize);
              if (imgEnd > imgStart) {
                const imgBytes = bytes.subarray(imgStart, imgEnd);
                return new Blob([imgBytes], { type: mime });
              }
            }
          }
        }
      }

      // 3. Check direct embedded JPEG SOI marker fallback
      for (let i = 0; i < Math.min(bytes.length - 512, 100000); i++) {
        if (bytes[i] === 0xFF && bytes[i + 1] === 0xD8 && bytes[i + 2] === 0xFF) {
          for (let j = i + 100; j < Math.min(bytes.length - 1, i + 1000000); j++) {
            if (bytes[j] === 0xFF && bytes[j + 1] === 0xD9) {
              const imgBytes = bytes.subarray(i, j + 2);
              if (imgBytes.length > 2000) {
                return new Blob([imgBytes], { type: 'image/jpeg' });
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn('Cover art extraction warning:', err);
    }
    return null;
  }

  static async updateTrackCover(id, coverBlob) {
    if (!id || !coverBlob) return false;
    try {
      const db = await this.open();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const getReq = store.get(Number(id));
        getReq.onsuccess = () => {
          const record = getReq.result;
          if (record) {
            record.coverBlob = coverBlob;
            store.put(record);
            resolve(true);
          } else {
            resolve(false);
          }
        };
        getReq.onerror = (e) => reject(e.target.error);
      });
    } catch (e) {
      return false;
    }
  }

  static async saveTrack(fileBlob, customMeta = {}) {
    const db = await this.open();
    const meta = this.parseFileMetadata(fileBlob.name || 'Untitled Track.mp3');
    const coverBlob = await this.extractCoverArt(fileBlob);

    const trackRecord = {
      title: customMeta.title || meta.title,
      artist: customMeta.artist || 'Study Playlist',
      size: fileBlob.size,
      type: fileBlob.type || 'audio/mpeg',
      blob: fileBlob,
      coverBlob: coverBlob || null,
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
