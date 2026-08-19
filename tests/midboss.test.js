import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { GameWorld } from '../src/gameplay/GameWorld.js';

const root = new URL('../', import.meta.url);
const packRoot = 'content-packs/astral-bloom';
const readJson = async (relativePath) => JSON.parse(await readFile(new URL(relativePath, root), 'utf8'));
const manifest = await readJson(`${packRoot}/manifest.json`);
const stageList = await Promise.all(manifest.stages.map((path) => readJson(`${packRoot}/${path}`)));
const data = {
  manifest,
  players: await readJson(`${packRoot}/player.json`),
  bullets: await readJson(`${packRoot}/bullets.json`),
  enemies: await readJson(`${packRoot}/enemies.json`),
  patterns: await readJson(`${packRoot}/patterns.json`),
  text: await readJson(`${packRoot}/text/ja.json`),
  stages: Object.fromEntries(stageList.map((stage) => [stage.id, stage])),
};

const world = new GameWorld(data);
world.setDifficulty('normal');
world.startStage('stage_eclipse_03');

const tessa = world.spawnEnemy('tessa_reave', 1045, 222);
assert.equal(tessa.isMidboss, true, 'テッサは中ボスとして識別されること');
assert.equal(tessa.isBoss, false, '中ボスは最終ボス扱いでないこと');
assert.equal(tessa.requiresEntry, true, '中ボスは入場完了まで弾幕を開始しないこと');
assert.equal(tessa.activePatterns.length, 2, '中ボスは第1フェーズ弾幕を持つこと');

const initialHp = tessa.hp;
assert.equal(tessa.takeDamage(initialHp), false, '中ボスは第1フェーズ終了時に直ちに消滅しないこと');
assert.equal(tessa.phaseChanged, true, '中ボスは第2フェーズへ遷移すること');
assert.equal(tessa.phaseIndex, 1, '中ボスは第2フェーズを選択すること');
tessa.phaseChanged = false;
assert.equal(tessa.takeDamage(tessa.hp), true, '最終フェーズ終了時に中ボスが撃破されること');
world.destroyEnemy(tessa);
assert.equal(world.state, 'playing', '中ボス撃破はステージクリアを直接発火させないこと');

const nox = world.spawnEnemy('nox_reave', 1045, 310);
assert.equal(nox.isMidboss, true, 'ノクスも中ボスバリエーションとして識別されること');
assert.ok(nox.definition.phases.length >= 2, 'ノクスは複数フェーズを持つこと');

console.log('midboss test: OK (two variants, entry and phase contracts)');
