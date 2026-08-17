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
    const candidates = [-48, 0, 48].flatMap((offsetX) => [-140, -70, 0, 70, 140].map((offsetY) => ({
      x: Math.max(58, Math.min(world.bounds.width * 0.46, player.x + offsetX)),
      y: Math.max(36, Math.min(world.bounds.height - 36, player.y + offsetY)),
    })));
    const enemyBullets = world.bullets.filter((bullet) => bullet.team === 'enemy' && bullet.x > player.x - 80 && bullet.x < player.x + 320);
    const safest = candidates.reduce((best, candidate) => {
      const risk = enemyBullets.reduce((total, bullet) => {
        const dx = bullet.x - candidate.x;
        const dy = bullet.y - candidate.y;
        return total + 1 / Math.max(1800, dx * dx + dy * dy);
      }, 0);
      const movementCost = Math.hypot(candidate.x - player.x, candidate.y - player.y) * 0.000002;
      const score = risk + movementCost;
      return score < best.score ? { candidate, score } : best;
    }, { candidate: { x: player.x, y: player.y }, score: Infinity }).candidate;
    const dx = safest.x - player.x;
    const dy = safest.y - player.y;
    const length = Math.hypot(dx, dy) || 1;
    return { x: dx / length, y: dy / length };
  },
};

world = new GameWorld(data);
const hitLog = [];
world.on('playerHit', () => {
  hitLog.push({
    time: Number(elapsed.toFixed(2)),
    x: Number(world.player.x.toFixed(1)),
    y: Number(world.player.y.toFixed(1)),
    bullets: world.bullets.filter((bullet) => bullet.team === 'enemy').length,
  });
});
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
  `第1ステージ前半は基本的な移動・ショット・ボムで継続できること (time=${elapsed.toFixed(1)}, lives=${world.player.lives}, bullets=${maxEnemyBullets}, score=${world.player.score}, hits=${JSON.stringify(hitLog)})`,
);
assert.ok(sawGardener, '結晶温室区間で結晶ガーデナーが出現すること');
assert.ok(sawScore, '通常敵を撃破してスコアを得られること');
assert.ok(maxEnemyBullets >= 10, '花弁弾幕として十分な敵弾が生成されること');
assert.ok(maxEnemyBullets <= 180, '第1ステージ前半の敵弾密度が初期プロトタイプの上限内であること');

console.log(`astral playtest: OK (lives=${world.player.lives}, maxEnemyBullets=${maxEnemyBullets}, score=${world.player.score})`);
