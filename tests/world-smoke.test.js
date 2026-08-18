import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { GameWorld } from '../src/gameplay/GameWorld.js';

const packId = process.argv[2] ?? 'astral-bloom';
const root = new URL('../', import.meta.url);
const packRoot = `content-packs/${packId}`;
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

const input = {
  isDown: (action) => action === 'shot',
  wasPressed: () => false,
  getMoveVector: () => ({ x: 0, y: 0 }),
};

const normalEnemyId = Object.entries(data.enemies).find(([, definition]) => definition.kind === 'enemy')?.[0];
const bossEnemyId = Object.entries(data.enemies).find(([, definition]) => definition.kind === 'boss')?.[0];
assert.ok(normalEnemyId, `${packId}: 通常敵が定義されていること`);
assert.ok(bossEnemyId, `${packId}: ボスが定義されていること`);

const world = new GameWorld(data);
const soundEvents = [];
const musicEvents = [];
world.on('sound', ({ id }) => soundEvents.push(id));
world.on('music', ({ id }) => musicEvents.push(id));
world.startStage(manifest.entryStage);
assert.equal(world.state, 'playing', `${packId}: ステージ開始後はプレイ中であること`);
if (packId === 'astral-bloom') {
  assert.ok(musicEvents.includes('bg_stage01'), 'ASTRAL BLOOM: ステージ開始時に通常BGMが発行されること');
  world.stageRunner.execute({ type: 'music', track: 'bg_boss01' }, world);
  assert.ok(musicEvents.includes('bg_boss01'), 'ASTRAL BLOOM: ボス戦BGMへの切替が発行されること');
}

for (let frame = 0; frame < 180; frame += 1) world.update(1 / 60, input);
assert.ok(world.enemyCount >= 1, `${packId}: タイムラインから敵が出現すること`);
assert.ok(world.bullets.some((bullet) => bullet.team === 'player'), `${packId}: ショット入力で自弾が生成されること`);
if (packId === 'astral-bloom') {
  assert.ok(soundEvents.includes('se_player_shot'), 'ASTRAL BLOOM: 自機ショットSEが発行されること');
}

const spawned = world.spawnEnemy(normalEnemyId, 270, 180);
assert.ok(spawned?.active, `${packId}: 定義から通常敵を生成できること`);
for (let frame = 0; frame < 50; frame += 1) world.patternRunner.update(1 / 60, world);
assert.ok(world.bullets.some((bullet) => bullet.team === 'enemy'), `${packId}: 弾幕定義から敵弾が生成されること`);
if (packId === 'astral-bloom') {
  assert.ok(soundEvents.includes('se_enemy_shot'), 'ASTRAL BLOOM: 敵弾SEが発行されること');
}

if (packId === 'astral-bloom') {
  world.destroyEnemy(spawned);
  assert.ok(soundEvents.includes('se_enemy_destroy'), 'ASTRAL BLOOM: 敵撃破SEが発行されること');
  world.damagePlayer();
  assert.ok(soundEvents.includes('se_player_hit'), 'ASTRAL BLOOM: 被弾SEが発行されること');
}

const boss = world.spawnEnemy(bossEnemyId, 270, 120);
assert.ok(boss?.isBoss, `${packId}: ボスを生成できること`);
if (boss.definition.phases?.length > 1) {
  const firstHp = boss.hp;
  assert.equal(boss.takeDamage(firstHp), false, `${packId}: 第1フェーズ撃破はボス本体を破壊しないこと`);
  assert.equal(boss.phaseIndex, 1, `${packId}: 次のボスフェーズへ移行すること`);
  assert.ok(boss.active, `${packId}: フェーズ移行後もボスが有効であること`);
}

const bombsBefore = world.player.bombs;
assert.equal(world.player.useBomb(), true, `${packId}: 残ボムがあればボムを使用できること`);
world.clearEnemyBullets();
assert.equal(world.bulletPool.activeItems.some((bullet) => bullet.team === 'enemy'), false, `${packId}: ボム処理で敵弾を消去できること`);
assert.equal(world.player.bombs, bombsBefore - 1, `${packId}: ボム使用で残数が減ること`);

console.log(`world smoke test (${packId}): OK`);
