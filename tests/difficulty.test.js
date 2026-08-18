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

const idleInput = {
  isDown: () => false,
  wasPressed: () => false,
  getMoveVector: () => ({ x: 0, y: 0 }),
};

function sampleDifficulty(id) {
  const world = new GameWorld(data);
  world.setDifficulty(id);
  world.startStage(manifest.entryStage);
  const enemy = world.spawnEnemy('pollen_scout', 720, 270);
  world.spawnEnemyBullet({ bulletId: 'petal_orb', x: 700, y: 270, vx: -100, vy: 0, ownerId: 'test' });
  const bulletVelocity = world.bullets.at(-1).vx;
  for (let frame = 0; frame < 70; frame += 1) world.update(1 / 60, idleInput);
  return {
    lives: world.player.lives,
    bombs: world.player.bombs,
    enemyHp: enemy.maxHp,
    bulletVelocity,
    enemyBullets: world.bullets.filter((bullet) => bullet.team === 'enemy').length,
  };
}

const easy = sampleDifficulty('easy');
const normal = sampleDifficulty('normal');
const hard = sampleDifficulty('hard');

assert.deepEqual([easy.lives, normal.lives, hard.lives], [5, 3, 2], '難易度ごとに初期残機が変化すること');
assert.deepEqual([easy.bombs, normal.bombs, hard.bombs], [4, 3, 2], '難易度ごとに初期ボム数が変化すること');
assert.ok(easy.enemyHp < normal.enemyHp && normal.enemyHp < hard.enemyHp, '敵耐久がEasyからHardへ増加すること');
assert.ok(Math.abs(easy.bulletVelocity) < Math.abs(normal.bulletVelocity) && Math.abs(normal.bulletVelocity) < Math.abs(hard.bulletVelocity), '敵弾速度がEasyからHardへ増加すること');
assert.ok(easy.enemyBullets < normal.enemyBullets && normal.enemyBullets < hard.enemyBullets, '弾幕密度がEasyからHardへ増加すること');

console.log(`difficulty test: OK (enemy bullets ${easy.enemyBullets}/${normal.enemyBullets}/${hard.enemyBullets})`);
