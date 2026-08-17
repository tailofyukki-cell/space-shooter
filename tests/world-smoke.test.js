import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { GameWorld } from '../src/gameplay/GameWorld.js';

const root = new URL('../', import.meta.url);
const readJson = async (relativePath) => JSON.parse(await readFile(new URL(relativePath, root), 'utf8'));

const manifest = await readJson('game-data/manifest.json');
const stageList = await Promise.all(manifest.stages.map((path) => readJson(`game-data/${path}`)));
const data = {
  manifest,
  players: await readJson('game-data/player.json'),
  bullets: await readJson('game-data/bullets.json'),
  enemies: await readJson('game-data/enemies.json'),
  patterns: await readJson('game-data/patterns.json'),
  text: await readJson('game-data/text/ja.json'),
  stages: Object.fromEntries(stageList.map((stage) => [stage.id, stage])),
};

const input = {
  isDown: (action) => action === 'shot',
  wasPressed: () => false,
  getMoveVector: () => ({ x: 0, y: 0 }),
};

const world = new GameWorld(data);
world.startStage(manifest.entryStage);
assert.equal(world.state, 'playing', 'ステージ開始後はプレイ中であること');

for (let frame = 0; frame < 80; frame += 1) world.update(1 / 60, input);
assert.ok(world.enemyCount >= 1, 'タイムラインから敵が出現すること');
assert.ok(world.bullets.some((bullet) => bullet.team === 'player'), 'ショット入力で自弾が生成されること');

const spawned = world.spawnEnemy('fairy_scout', 270, 180);
assert.ok(spawned?.active, '定義から敵を生成できること');
for (let frame = 0; frame < 40; frame += 1) world.patternRunner.update(1 / 60, world);
assert.ok(world.bullets.some((bullet) => bullet.team === 'enemy'), '弾幕定義から敵弾が生成されること');

const bombsBefore = world.player.bombs;
assert.equal(world.player.useBomb(), true, '残ボムがあればボムを使用できること');
world.clearEnemyBullets();
assert.equal(world.bulletPool.activeItems.some((bullet) => bullet.team === 'enemy'), false, 'ボム処理で敵弾を消去できること');
assert.equal(world.player.bombs, bombsBefore - 1, 'ボム使用で残数が減ること');

console.log('world smoke test: OK');
