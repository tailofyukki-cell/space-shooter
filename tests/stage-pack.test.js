import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const packRoot = 'content-packs/astral-bloom';
const readJson = async (relativePath) => JSON.parse(await readFile(new URL(relativePath, root), 'utf8'));

const manifest = await readJson(`${packRoot}/manifest.json`);
const enemies = await readJson(`${packRoot}/enemies.json`);
const stages = await Promise.all(manifest.stages.map((path) => readJson(`${packRoot}/${path}`)));

assert.equal(stages.length, 2, 'ASTRAL BLOOMは少なくとも2ステージを持つこと');
assert.deepEqual(
  stages.map((stage) => stage.id),
  ['stage_glassrain_01', 'stage_moonrain_02'],
  'ステージ選択に登録する順番が作品進行と一致すること',
);

for (const stage of stages) {
  assert.ok(stage.title.startsWith('STAGE '), `${stage.id}: 表示用ステージ名を持つこと`);
  assert.ok(manifest.visuals.backgrounds?.[stage.id], `${stage.id}: 専用背景アセットが定義されていること`);
  assert.equal(stage.clear?.type, 'bossDefeat', `${stage.id}: ボス撃破でクリアすること`);

  const spawnEvents = stage.timeline.filter((event) => event.type === 'spawn' || event.type === 'boss');
  assert.ok(spawnEvents.length > 0, `${stage.id}: 敵出現イベントを持つこと`);
  for (const event of spawnEvents) {
    assert.ok(enemies[event.enemy], `${stage.id}: ${event.enemy} が敵定義に存在すること`);
  }

  const bossEvent = stage.timeline.find((event) => event.type === 'boss');
  assert.ok(bossEvent, `${stage.id}: ボス出現イベントを持つこと`);
  assert.equal(enemies[bossEvent.enemy]?.kind, 'boss', `${stage.id}: ボスイベントがボス定義を参照すること`);
}

console.log('stage pack test: OK (2 stages)');
