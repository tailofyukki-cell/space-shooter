export class AudioManager {
  constructor(assetMap = {}, settings = {}) {
    this.assetMap = assetMap;
    this.bgmVolume = settings.bgm ?? 0.8;
    this.seVolume = settings.se ?? 0.9;
    this.currentMusicId = null;
    this.currentMusic = null;
    this.unlocked = false;
    this.warnedMissing = new Set();
    this.lastEffectAt = new Map();
    this.effectCooldowns = {
      se_player_shot: 45,
      se_enemy_shot: 72,
      se_graze: 85,
    };
    this.duckToken = 0;
  }

  async unlock() {
    this.unlocked = true;
  }

  setVolumes({ bgm, se }) {
    if (typeof bgm === 'number') this.bgmVolume = bgm;
    if (typeof se === 'number') this.seVolume = se;
    if (this.currentMusic) this.currentMusic.volume = this.bgmVolume;
  }

  resolve(id) {
    const path = this.assetMap[id];
    if (!path && !this.warnedMissing.has(id)) {
      console.info(`音声アセット「${id}」は未配置のため再生をスキップします。`);
      this.warnedMissing.add(id);
    }
    return path;
  }

  fade(audio, targetVolume, durationMs, onComplete = null) {
    const startVolume = audio.volume;
    const startAt = performance.now();
    const timer = globalThis.setInterval(() => {
      const progress = Math.min(1, (performance.now() - startAt) / durationMs);
      audio.volume = startVolume + (targetVolume - startVolume) * progress;
      if (progress < 1) return;
      globalThis.clearInterval(timer);
      onComplete?.();
    }, 16);
  }

  playMusic(id) {
    if (!this.unlocked || this.currentMusicId === id) return;
    const source = this.resolve(id);
    if (!source) return;

    const previousMusic = this.currentMusic;
    const audio = new Audio(source);
    audio.loop = true;
    audio.volume = 0;
    audio.addEventListener('error', () => {
      if (!this.warnedMissing.has(source)) {
        console.warn(`BGMを再生できませんでした: ${source}`);
        this.warnedMissing.add(source);
      }
    }, { once: true });
    audio.play().catch(() => {});

    this.currentMusicId = id;
    this.currentMusic = audio;
    this.fade(audio, this.bgmVolume, 420);
    if (previousMusic) {
      this.fade(previousMusic, 0, 260, () => {
        previousMusic.pause();
        previousMusic.currentTime = 0;
      });
    }
  }

  stopMusic() {
    if (this.currentMusic) {
      this.currentMusic.pause();
      this.currentMusic.currentTime = 0;
    }
    this.currentMusic = null;
    this.currentMusicId = null;
  }

  duckMusic(durationMs = 350) {
    if (!this.currentMusic) return;
    const music = this.currentMusic;
    const token = this.duckToken += 1;
    music.volume = this.bgmVolume * 0.38;
    globalThis.setTimeout(() => {
      if (token !== this.duckToken || music !== this.currentMusic) return;
      this.fade(music, this.bgmVolume, 180);
    }, durationMs);
  }

  shouldThrottleEffect(id) {
    const cooldown = this.effectCooldowns[id] ?? 0;
    if (!cooldown) return false;
    const now = performance.now();
    const last = this.lastEffectAt.get(id) ?? -Infinity;
    if (now - last < cooldown) return true;
    this.lastEffectAt.set(id, now);
    return false;
  }

  playEffect(id, options = {}) {
    if (!this.unlocked || this.shouldThrottleEffect(id)) return;
    const source = this.resolve(id);
    if (!source) return;
    const audio = new Audio(source);
    audio.volume = Math.max(0, Math.min(1, this.seVolume * (options.volume ?? 1)));
    audio.addEventListener('error', () => {
      if (!this.warnedMissing.has(source)) {
        console.warn(`SEを再生できませんでした: ${source}`);
        this.warnedMissing.add(source);
      }
    }, { once: true });
    audio.play().catch(() => {});
    if (options.duckMusic) this.duckMusic();
  }

  dispose() {
    this.stopMusic();
    this.lastEffectAt.clear();
  }
}
