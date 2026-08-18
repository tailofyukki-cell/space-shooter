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

assert.equal(manifest.campaign?.endingAfterFinalStage, true, '最終ステージ後にエンディングを表示するキャンペーン設定があること');
const finalStage = stageList.at(-1);
assert.equal(finalStage.id, 'stage_moonrain_02', '第2ステージが現在のキャンペーン終端であること');

const world = new GameWorld(data);
world.setDifficulty('hard');
world.startStage(finalStage.id);
const bossEvent = finalStage.timeline.find((event) => event.type === 'boss');
const boss = world.spawnEnemy(bossEvent.enemy, bossEvent.x, bossEvent.y);
world.stageRunner.boss = boss;
let clearedStage = null;
world.on('stageClear', ({ stage }) => { clearedStage = stage; });
boss.active = false;
boss.dead = true;
world.update(1 / 60, { isDown: () => false, wasPressed: () => false, getMoveVector: () => ({ x: 0, y: 0 }) });
assert.equal(clearedStage?.id, finalStage.id, '最終ボス撃破時に終端ステージのクリアイベントが発火すること');

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const main = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');
assert.match(html, /id="ending-screen"/, 'エンディング画面コンテナが存在すること');
assert.match(main, /isFinalCampaignStage\(stage\)/, '最終ステージだけをエンディングへ遷移させること');
assert.match(main, /showEnding\(/, 'エンディング表示処理が接続されていること');

console.log('ending flow test: OK');
