import assert from 'node:assert/strict';
import { AudioManager } from '../src/core/AudioManager.js';

const instances = [];
class MockAudio {
  constructor(source) {
    this.source = source;
    this.loop = false;
    this.volume = 1;
    this.currentTime = 0;
    this.playCount = 0;
    this.paused = false;
    instances.push(this);
  }

  addEventListener() {}

  play() {
    this.playCount += 1;
    return Promise.resolve();
  }

  pause() {
    this.paused = true;
  }
}

globalThis.Audio = MockAudio;

const manager = new AudioManager({
  bg_stage01: 'stage.mp3',
  bg_boss01: 'boss.mp3',
  se_player_shot: 'shot.mp3',
  se_graze: 'graze.mp3',
  se_player_hit: 'hit.mp3',
}, { bgm: 0.7, se: 0.8 });

await manager.unlock();
manager.playMusic('bg_stage01');
assert.equal(instances.length, 1, '通常BGMを作成すること');
assert.equal(instances[0].source, 'stage.mp3');
assert.equal(instances[0].loop, true, 'BGMをループすること');
assert.equal(instances[0].playCount, 1, '通常BGMを再生すること');
manager.playMusic('bg_stage01');
assert.equal(instances.length, 1, '同じBGMを再作成しないこと');

manager.playEffect('se_player_shot', { volume: 0.5 });
assert.equal(instances.length, 2, 'ショットSEを再生すること');
assert.equal(instances[1].volume, 0.4, 'SE音量設定と個別倍率を掛けること');
manager.playEffect('se_graze');
manager.playEffect('se_graze');
assert.equal(instances.length, 3, 'グレイズSEは短時間の連打を間引くこと');

manager.playMusic('bg_boss01');
assert.equal(instances.length, 4, 'ボスBGMを作成すること');
assert.equal(instances[3].source, 'boss.mp3');
manager.playEffect('se_player_hit', { duckMusic: true });
assert.ok(instances[3].volume <= 0.7, '被弾時にBGMをダッキングすること');
manager.dispose();
assert.equal(manager.currentMusic, null, '破棄時にBGM参照を解除すること');

console.log('audio manager test: OK');
