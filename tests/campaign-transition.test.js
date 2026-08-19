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

const stageIds = stageList.map((stage) => stage.id);
assert.deepEqual(stageIds, ['stage_glassrain_01', 'stage_moonrain_02', 'stage_eclipse_03', 'stage_core_04'], 'キャンペーン順序が第1〜第4ステージであること');

const world = new GameWorld(data);
world.setDifficulty('normal');
world.startStage(stageIds[0]);
world.player.lives = 2;
world.player.bombs = 1;
world.player.score = 24890;
world.player.graze = 37;
const initialSpawn = [world.player.x, world.player.y];

let transitionPayload = null;
world.on('campaignTransition', (payload) => { transitionPayload = payload; });
world.beginCampaignTransition(stageIds[1]);
assert.equal(world.state, 'transition', '通常ステージクリア後は次ステージ遷移状態になること');
assert.equal(world.nextStage?.id, stageIds[1], '次のキャンペーンステージが予約されること');
assert.equal(transitionPayload?.fromStage?.id, stageIds[0], '遷移イベントはクリア済みステージを通知すること');
assert.equal(transitionPayload?.nextStage?.id, stageIds[1], '遷移イベントは次ステージを通知すること');

world.startStage(stageIds[1], { preservePlayer: true });
assert.equal(world.stage.id, stageIds[1], '予約した次ステージが開始されること');
assert.equal(world.state, 'playing', '次ステージ開始後はプレイ状態へ戻ること');
assert.equal(world.player.lives, 2, '次ステージへ残機を維持すること');
assert.equal(world.player.bombs, 1, '次ステージへボムを維持すること');
assert.equal(world.player.score, 24890, '次ステージへスコアを維持すること');
assert.equal(world.player.graze, 37, '次ステージへグレイズを維持すること');
assert.deepEqual([world.player.x, world.player.y], initialSpawn, '次ステージは自機開始位置から安全に再開すること');
assert.ok(world.player.invincibleTimer >= 2, '次ステージ開始直後は入場無敵を付与すること');

world.startStage(stageIds[0]);
assert.equal(world.player.score, 0, '新規出撃はスコアを初期化すること');
assert.equal(world.player.lives, world.difficulty.playerLives, '新規出撃は難易度の初期残機を適用すること');

console.log('campaign transition test: OK (carry-over and reset contracts)');
