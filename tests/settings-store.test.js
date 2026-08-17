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

first.patch({ bgm: 0.42, se: 2, fullscreen: true });
const restored = new SettingsStore(gameId, storage).get();
assert.equal(restored.bgm, 0.42, 'BGM音量が保存されること');
assert.equal(restored.se, 1, '音量が0〜1に正規化されること');
assert.equal(restored.fullscreen, true, 'フルスクリーン設定が保存されること');

console.log('settings store test: OK');
