import assert from 'node:assert/strict';
import { Renderer } from '../src/render/Renderer.js';

const operations = [];
const context = {
  save: () => operations.push('save'),
  restore: () => operations.push('restore'),
  translate: () => operations.push('translate'),
  rotate: () => operations.push('rotate'),
  beginPath: () => operations.push('beginPath'),
  rect: () => operations.push('rect'),
  clip: () => operations.push('clip'),
  fillRect: () => operations.push('fillRect'),
  strokeRect: () => operations.push('strokeRect'),
  createLinearGradient: () => ({ addColorStop: () => {} }),
  createRadialGradient: () => ({ addColorStop: () => {} }),
  arc: () => operations.push('arc'),
  fill: () => operations.push('fill'),
  stroke: () => operations.push('stroke'),
  drawImage: () => operations.push('drawImage'),
  fillText: () => operations.push('fillText'),
  set globalAlpha(value) { operations.push(`alpha:${value}`); },
  set fillStyle(value) { operations.push('fillStyle'); },
  set strokeStyle(value) { operations.push('strokeStyle'); },
  set lineWidth(value) { operations.push('lineWidth'); },
};

const canvas = { getContext: () => context };
const data = {
  manifest: {
    title: 'Boundary Test',
    display: { width: 1280, height: 720, fieldWidth: 960, fieldHeight: 540 },
    gameplay: { scrollAxis: 'horizontal' },
  },
  text: {},
};
const renderer = new Renderer(canvas, data);
const actualDrawEnemy = renderer.drawEnemy.bind(renderer);
renderer.stars = [];
renderer.drawParticles = () => operations.push('particles');
renderer.drawBullet = () => operations.push('bullet');
renderer.drawEnemy = () => operations.push('enemy');
renderer.drawPlayer = () => operations.push('player');

renderer.drawField(context, {
  background: {},
  bullets: [{ x: -30, y: -30 }],
  enemies: [{ x: 1000, y: 200 }],
  player: { x: 80, y: 270 },
});

const clipIndex = operations.indexOf('clip');
const firstGameplayDrawIndex = Math.min(
  operations.indexOf('particles'),
  operations.indexOf('bullet'),
  operations.indexOf('enemy'),
  operations.indexOf('player'),
);
const borderIndex = operations.lastIndexOf('strokeRect');
const restoreBeforeBorder = operations.lastIndexOf('restore', borderIndex);

assert.ok(clipIndex >= 0, 'プレイフィールド描画はCanvasクリッピングを有効化すること');
assert.ok(clipIndex < firstGameplayDrawIndex, '弾・敵・自機を描画する前にクリッピングを開始すること');
assert.ok(restoreBeforeBorder > firstGameplayDrawIndex, 'フィールド枠線はクリッピングの外側に描画すること');

operations.length = 0;
renderer.images.set('sprite:pollen_scout', { width: 64, height: 48 });
actualDrawEnemy(context, {
  id: 'pollen_scout:7',
  typeId: 'pollen_scout',
  age: 0,
  isBoss: false,
  definition: { color: '#96ff6a' },
});
assert.ok(operations.includes('drawImage'), '敵の一意IDではなくタイプIDから実スプライトを描画すること');

operations.length = 0;
renderer.startBomb({ x: 120, y: 180, duration: 1.35, canceledBullets: 9, clearedEnemies: 2 });
renderer.drawBombEffect(context);
assert.ok(operations.includes('fillText'), 'ボム演出は発動名とキャンセル情報をフィールド内へ描画すること');
assert.ok(operations.includes('stroke'), 'ボム演出は視認可能な星環を描画すること');
renderer.update(2);
assert.equal(renderer.bombEffect, null, 'ボム演出は持続時間後に終了すること');

console.log('renderer boundary test: OK');
