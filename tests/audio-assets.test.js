import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(root, 'content-packs', 'astral-bloom', 'manifest.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const expectedKeys = [
  'bg_stage01',
  'bg_boss01',
  'se_player_shot',
  'se_enemy_shot',
  'se_enemy_destroy',
  'se_boss_phase',
  'se_player_hit',
  'se_graze',
  'se_bomb',
];

for (const key of expectedKeys) {
  const assetPath = manifest.assets?.[key];
  assert.ok(assetPath, `音声キー ${key} が定義されていること`);
  assert.match(assetPath, /\.mp3$/i, `${key} は配布用MP3を参照すること`);
  await access(path.join(root, assetPath), constants.R_OK);
}

assert.equal(expectedKeys.length, Object.keys(manifest.assets).length, '未管理の音声キーを残さないこと');
console.log(`audio assets test: OK (${expectedKeys.length} assets)`);
