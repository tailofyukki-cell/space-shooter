import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(root, 'content-packs', 'astral-bloom', 'manifest.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));

assert.equal(manifest.gameplay?.scrollAxis, 'horizontal', 'ASTRAL BLOOMの実アートは横スクロール版に紐付くこと');
assert.ok(manifest.visuals?.background, 'ステージ背景が定義されていること');
assert.ok(manifest.visuals?.sprites?.player, '自機スプライトが定義されていること');

const stageBackgrounds = manifest.visuals.backgrounds ?? {};
const references = [
  manifest.visuals.background,
  ...Object.values(stageBackgrounds),
  ...Object.values(manifest.visuals.sprites),
];

for (const relativePath of references) {
  assert.match(relativePath, /\.(png|jpe?g)$/i, `${relativePath} が画像であること`);
  await access(path.join(root, relativePath), constants.R_OK);
}

assert.deepEqual(
  Object.keys(stageBackgrounds).sort(),
  ['stage_core_04', 'stage_eclipse_03', 'stage_glassrain_01', 'stage_moonrain_02'],
  '登録済みの各ステージに専用背景が定義されていること',
);
assert.deepEqual(
  Object.keys(manifest.visuals.sprites).sort(),
  ['aurea_eclipse', 'crystal_gardener', 'flora_orbis', 'garden_heart', 'lumen_archon', 'nox_reave', 'petal_wisp', 'player', 'pollen_scout', 'tessa_reave'],
  '複数ステージの実アートが自機・通常敵・各ボスを網羅すること',
);

console.log(`art assets test: OK (${references.length} assets)`);
