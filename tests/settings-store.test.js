import assert from 'node:assert/strict';
import { SettingsStore } from '../src/core/SettingsStore.js';

class MemoryStorage {
  constructor() {
    this.values = new Map();
  }

  getItem(key) {
    return this.values.get(key) ?? null;
  }

  setItem(key, value) {
    this.values.set(key, value);
  }
}

const storage = new MemoryStorage();
const gameId = 'com.example.settings-test';
const first = new SettingsStore(gameId, storage);
assert.equal(first.get().bgm, 0.8, '既定BGM音量が適用されること');
assert.equal(first.get().se, 0.9, '既定SE音量が適用されること');
assert.equal(first.get().difficulty, 'normal', '既定難易度がNormalであること');

first.patch({ bgm: 0.42, se: 2, fullscreen: true, difficulty: 'hard' });
const restored = new SettingsStore(gameId, storage).get();
assert.equal(restored.bgm, 0.42, 'BGM音量が保存されること');
assert.equal(restored.se, 1, '音量が0〜1に正規化されること');
assert.equal(restored.fullscreen, true, 'フルスクリーン設定が保存されること');
assert.equal(restored.difficulty, 'hard', '難易度設定が保存されること');
const normalized = first.patch({ difficulty: 'invalid' });
assert.equal(normalized.difficulty, 'normal', '不正な難易度はNormalへ正規化されること');

console.log('settings store test: OK');
