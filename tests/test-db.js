// tests/test-db.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { StudyDB } from '../js/db.js';

test('StudyDB metadata parsing derives clean titles from filenames', () => {
  const meta1 = StudyDB.parseFileMetadata('01 - Deep Focus - Chopin Nocturne.mp3');
  assert.equal(meta1.title, '01 - Deep Focus - Chopin Nocturne');
  assert.equal(meta1.ext, 'mp3');

  const meta2 = StudyDB.parseFileMetadata('ambient_study_waves.flac');
  assert.equal(meta2.title, 'ambient study waves');
  assert.equal(meta2.ext, 'flac');
});

test('StudyDB formats byte sizes legibly', () => {
  assert.equal(StudyDB.formatBytes(1048576), '1.0 MB');
  assert.equal(StudyDB.formatBytes(5242880), '5.0 MB');
  assert.equal(StudyDB.formatBytes(500), '500 B');
});
