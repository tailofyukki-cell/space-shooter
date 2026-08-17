export class AudioManager {
  constructor(assetMap = {}, settings = {}) {
    this.assetMap = assetMap;
    this.bgmVolume = settings.bgm ?? 0.8;
    this.seVolume = settings.se ?? 0.9;
    this.currentMusicId = null;
    this.currentMusic = null;
    this.unlocked = false;
    this.warnedMissing = new Set();
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

  playMusic(id) {
    if (!this.unlocked || this.currentMusicId === id) return;
    const source = this.resolve(id);
    if (!source) return;

    this.stopMusic();
    const audio = new Audio(source);
    audio.loop = true;
    audio.volume = this.bgmVolume;
    audio.addEventListener('error', () => {
      if (!this.warnedMissing.has(source)) {
        console.warn(`BGMを再生できませんでした: ${source}`);
        this.warnedMissing.add(source);
      }
    }, { once: true });
    audio.play().catch(() => {});
    this.currentMusicId = id;
    this.currentMusic = audio;
  }

  stopMusic() {
    if (this.currentMusic) {
      this.currentMusic.pause();
      this.currentMusic.currentTime = 0;
    }
    this.currentMusic = null;
    this.currentMusicId = null;
  }

  playEffect(id, options = {}) {
    if (!this.unlocked) return;
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
  }

  dispose() {
    this.stopMusic();
  }
}
