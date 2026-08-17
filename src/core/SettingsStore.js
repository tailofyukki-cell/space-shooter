import { clamp } from './math.js';
import { DEFAULT_BINDINGS } from './InputManager.js';

const SETTINGS_SCHEMA_VERSION = 1;

export const DEFAULT_SETTINGS = {
  bgm: 0.8,
  se: 0.9,
  fullscreen: false,
  bindings: DEFAULT_BINDINGS,
};

export class SettingsStore {
  constructor(gameId, storage = window.localStorage) {
    this.key = `${gameId}:settings`;
    this.storage = storage;
    this.settings = this.load();
  }

  load() {
    try {
      const raw = this.storage.getItem(this.key);
      if (!raw) return structuredClone(DEFAULT_SETTINGS);
      const parsed = JSON.parse(raw);
      return this.normalize(parsed.settings ?? parsed);
    } catch (error) {
      console.warn('設定を読み込めなかったため、既定値を使用します。', error);
      return structuredClone(DEFAULT_SETTINGS);
    }
  }

  normalize(candidate) {
    return {
      bgm: clamp(Number(candidate.bgm ?? DEFAULT_SETTINGS.bgm), 0, 1),
      se: clamp(Number(candidate.se ?? DEFAULT_SETTINGS.se), 0, 1),
      fullscreen: Boolean(candidate.fullscreen ?? DEFAULT_SETTINGS.fullscreen),
      bindings: { ...structuredClone(DEFAULT_BINDINGS), ...(candidate.bindings ?? {}) },
    };
  }

  save() {
    const payload = {
      schemaVersion: SETTINGS_SCHEMA_VERSION,
      settings: this.settings,
    };
    this.storage.setItem(this.key, JSON.stringify(payload));
  }

  patch(values) {
    this.settings = this.normalize({ ...this.settings, ...values });
    this.save();
    return this.get();
  }

  get() {
    return structuredClone(this.settings);
  }

  reset() {
    this.settings = structuredClone(DEFAULT_SETTINGS);
    this.save();
    return this.get();
  }
}
