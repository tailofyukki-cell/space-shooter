async function loadJson(path) {
  const response = await fetch(path, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`ゲームデータを読み込めませんでした: ${path} (${response.status})`);
  }
  return response.json();
}

function resolvePath(basePath, relativePath) {
  const base = new URL(basePath, window.location.href);
  return new URL(relativePath, base).pathname;
}

export class GameDataLoader {
  constructor(basePath = './game-data/') {
    this.basePath = basePath.endsWith('/') ? basePath : `${basePath}/`;
  }

  async load() {
    const manifest = await loadJson(`${this.basePath}manifest.json`);
    this.validateManifest(manifest);

    const readDataFile = async (key) => {
      const relativePath = manifest.dataFiles[key];
      return loadJson(resolvePath(this.basePath, relativePath));
    };

    const [players, bullets, enemies, patterns, text, stages] = await Promise.all([
      readDataFile('player'),
      readDataFile('bullets'),
      readDataFile('enemies'),
      readDataFile('patterns'),
      readDataFile('text'),
      Promise.all(
        manifest.stages.map((stagePath) => loadJson(resolvePath(this.basePath, stagePath))),
      ),
    ]);

    const data = {
      manifest,
      players,
      bullets,
      enemies,
      patterns,
      text,
      stages: Object.fromEntries(stages.map((stage) => [stage.id, stage])),
    };

    this.validateData(data);
    return data;
  }

  validateManifest(manifest) {
    const required = ['id', 'title', 'version', 'display', 'entryStage', 'defaultPlayer', 'dataFiles', 'stages'];
    for (const key of required) {
      if (!(key in manifest)) throw new Error(`manifest.json に必須項目「${key}」がありません。`);
    }
  }

  validateData(data) {
    const { manifest, players, bullets, enemies, patterns, stages } = data;
    if (!players[manifest.defaultPlayer]) {
      throw new Error(`自機定義「${manifest.defaultPlayer}」が見つかりません。`);
    }
    if (!stages[manifest.entryStage]) {
      throw new Error(`開始ステージ「${manifest.entryStage}」が見つかりません。`);
    }

    for (const [enemyId, enemy] of Object.entries(enemies)) {
      for (const patternId of enemy.patterns ?? []) {
        if (!patterns[patternId]) {
          throw new Error(`敵「${enemyId}」が存在しない弾幕「${patternId}」を参照しています。`);
        }
      }
      for (const phase of enemy.phases ?? []) {
        for (const patternId of phase.patterns ?? []) {
          if (!patterns[patternId]) {
            throw new Error(`ボス「${enemyId}」が存在しない弾幕「${patternId}」を参照しています。`);
          }
        }
      }
    }

    for (const [patternId, pattern] of Object.entries(patterns)) {
      for (const event of pattern.events ?? []) {
        if (event.bullet && !bullets[event.bullet]) {
          throw new Error(`弾幕「${patternId}」が存在しない弾「${event.bullet}」を参照しています。`);
        }
      }
    }

    for (const stage of Object.values(stages)) {
      for (const event of stage.timeline ?? []) {
        if ((event.type === 'spawn' || event.type === 'boss') && !enemies[event.enemy]) {
          throw new Error(`ステージ「${stage.id}」が存在しない敵「${event.enemy}」を参照しています。`);
        }
      }
    }
  }
}
