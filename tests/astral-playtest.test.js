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

let elapsed = 0;
let nextBombAt = 12;
let bombPressed = false;
let world;
const input = {
  isDown: (action) => action === 'shot',
  wasPressed: (action) => action === 'bomb' && bombPressed,
  getMoveVector: () => {
    if (!world) return { x: 0, y: 0 };
    const player = world.player;
    const lanes = [-120, -60, 0, 60, 120]
      .map((offset) => Math.max(22, Math.min(world.bounds.width - 22, player.x + offset)));
    const enemyBullets = world.bullets.filter((bullet) => bullet.team === 'enemy' && bullet.y > player.y - 230 && bullet.y < player.y + 90);
    const safestLane = lanes.reduce((best, lane) => {
      const risk = enemyBullets.reduce((total, bullet) => {
        const distance = Math.abs(bullet.x - lane);
        return total + 1 / Math.max(900, distance * distance);
      }, 0);
      return risk < best.risk ? { lane, risk } : best;
    }, { lane: player.x, risk: Infinity }).lane;
    return { x: Math.sign(safestLane - player.x), y: 0 };
  },
};

world = new GameWorld(data);
world.startStage(manifest.entryStage);
let maxEnemyBullets = 0;
let sawGardener = false;
let sawScore = false;

for (let frame = 0; frame < 52 * 60; frame += 1) {
  elapsed = frame / 60;
  bombPressed = elapsed >= nextBombAt;
  if (bombPressed) nextBombAt += 12;
  world.update(1 / 60, input);
  maxEnemyBullets = Math.max(maxEnemyBullets, world.bullets.filter((bullet) => bullet.team === 'enemy').length);
  sawGardener ||= world.enemies.some((enemy) => enemy.definition.id === 'crystal_gardener' || enemy.definition.name === '結晶ガーデナー');
  sawScore ||= world.player.score > 0;
  if (world.state === 'gameover') break;
}

assert.notEqual(
  world.state,
  'gameover',
  `第1ステージ前半は基本的な移動・ショット・ボムで継続できること (time=${elapsed.toFixed(1)}, lives=${world.player.lives}, bullets=${maxEnemyBullets}, score=${world.player.score})`,
);
assert.ok(sawGardener, '結晶温室区間で結晶ガーデナーが出現すること');
assert.ok(sawScore, '通常敵を撃破してスコアを得られること');
assert.ok(maxEnemyBullets >= 10, '花弁弾幕として十分な敵弾が生成されること');
assert.ok(maxEnemyBullets <= 180, '第1ステージ前半の敵弾密度が初期プロトタイプの上限内であること');

console.log(`astral playtest: OK (lives=${world.player.lives}, maxEnemyBullets=${maxEnemyBullets}, score=${world.player.score})`);
