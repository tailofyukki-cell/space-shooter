import { EntityPool } from '../core/EntityPool.js';
import { circlesOverlap, vectorFromAngle } from '../core/math.js';
import { Bullet } from './Bullet.js';
import { Enemy } from './Enemy.js';
import { PatternRunner } from './PatternRunner.js';
import { Player } from './Player.js';
import { StageRunner } from './StageRunner.js';

const FALLBACK_DIFFICULTY = {
  label: 'NORMAL',
  playerLives: 3,
  playerBombs: 3,
  enemyHpMultiplier: 1,
  bulletSpeedMultiplier: 1,
  bulletDensityMultiplier: 1,
};

function scaleEnemyDefinition(definition, multiplier) {
  const scaled = structuredClone(definition);
  const scaleHp = (hp) => Math.max(1, Math.round((hp ?? 1) * multiplier));
  scaled.hp = scaleHp(scaled.hp);
  if (scaled.phases) {
    scaled.phases = scaled.phases.map((phase) => ({ ...phase, hp: scaleHp(phase.hp ?? scaled.hp) }));
  }
  return scaled;
}

export class GameWorld {
  constructor(data) {
    this.data = data;
    this.bounds = {
      width: data.manifest.display.fieldWidth,
      height: data.manifest.display.fieldHeight,
    };
    this.listeners = new Map();
    this.player = new Player(data.players[data.manifest.defaultPlayer], this.bounds);
    this.enemyPool = new EntityPool(() => new Enemy());
    this.bulletPool = new EntityPool(() => new Bullet());
    this.patternRunner = new PatternRunner(data.patterns);
    this.entitySequence = 0;
    this.state = 'title';
    this.stage = null;
    this.stageRunner = null;
    this.nextStage = null;
    this.background = null;
    this.difficultyId = 'normal';
    this.difficultyPresets = data.manifest.difficultyPresets ?? { normal: FALLBACK_DIFFICULTY };
    this.difficulty = this.difficultyPresets.normal ?? FALLBACK_DIFFICULTY;
  }

  setDifficulty(difficultyId = 'normal') {
    const preset = this.difficultyPresets[difficultyId] ?? this.difficultyPresets.normal ?? FALLBACK_DIFFICULTY;
    this.difficultyId = this.difficultyPresets[difficultyId] ? difficultyId : 'normal';
    this.difficulty = { ...FALLBACK_DIFFICULTY, ...preset };
    return this.difficulty;
  }

  on(name, handler) {
    const handlers = this.listeners.get(name) ?? new Set();
    handlers.add(handler);
    this.listeners.set(name, handlers);
    return () => handlers.delete(handler);
  }

  emit(name, payload = {}) {
    for (const handler of this.listeners.get(name) ?? []) handler(payload);
  }

  startStage(stageId, { preservePlayer = false } = {}) {
    const definition = this.data.stages[stageId];
    if (!definition) throw new Error(`ステージ「${stageId}」が見つかりません。`);

    this.enemyPool.deactivateAll();
    this.bulletPool.deactivateAll();
    this.patternRunner.clear();
    this.entitySequence = 0;
    const carry = preservePlayer
      ? {
          lives: this.player.lives,
          bombs: this.player.bombs,
          score: this.player.score,
          graze: this.player.graze,
          invincibility: 2.25,
        }
      : {
          lives: this.difficulty.playerLives,
          bombs: this.difficulty.playerBombs,
        };
    this.player.reset(carry);
    this.stage = definition;
    this.background = definition.background;
    this.nextStage = null;
    this.stageRunner = new StageRunner(definition);
    this.state = 'playing';
    this.stageRunner.start(this);
  }

  beginCampaignTransition(nextStageId) {
    const definition = this.data.stages[nextStageId];
    if (!definition) throw new Error(`次ステージ「${nextStageId}」が見つかりません。`);
    this.nextStage = definition;
    this.state = 'transition';
    this.emit('campaignTransition', {
      fromStage: this.stage,
      nextStage: definition,
      carry: {
        lives: this.player.lives,
        bombs: this.player.bombs,
        score: this.player.score,
        graze: this.player.graze,
      },
    });
  }

  update(dt, input) {
    if (this.state !== 'playing') return;
    this.player.update(dt, input, (shot) => this.spawnPlayerShot(shot));

    if (input.wasPressed('bomb') && this.player.useBomb()) {
      const canceledBullets = this.clearEnemyBullets();
      const clearedEnemies = this.applyBombPulse();
      this.player.addScore(canceledBullets * 12 + clearedEnemies * 80);
      this.emit('sound', { id: 'se_bomb', volume: 0.82 });
      this.emit('bomb', {
        x: this.player.x,
        y: this.player.y,
        duration: this.player.bombTimer,
        canceledBullets,
        clearedEnemies,
      });
    }

    this.stageRunner.update(dt, this);
    if (this.stageRunner.completed) this.state = 'clear';
    this.enemyPool.forEachActive((enemy) => enemy.update(dt, this.bounds));
    this.patternRunner.update(dt, this);
    this.bulletPool.forEachActive((bullet) => bullet.update(dt, this.bounds));
    this.resolveCollisions();
  }

  spawnPlayerShot(shot) {
    const definition = this.data.bullets[shot.bullet];
    if (!definition) return;
    const velocity = vectorFromAngle(shot.angle, shot.speed ?? definition.speed);
    this.bulletPool.acquire({
      definition,
      x: this.player.x + shot.offsetX,
      y: this.player.y + shot.offsetY,
      vx: velocity.x,
      vy: velocity.y,
      ownerId: 'player',
    });
    this.emit('sound', { id: 'se_player_shot', volume: 0.16 });
  }

  spawnEnemyBullet({ bulletId, x, y, vx, vy, ownerId }) {
    const definition = this.data.bullets[bulletId];
    if (!definition) return null;
    const speedMultiplier = this.difficulty.bulletSpeedMultiplier ?? 1;
    return this.bulletPool.acquire({ definition, x, y, vx: vx * speedMultiplier, vy: vy * speedMultiplier, ownerId });
  }

  spawnEnemy(enemyId, x, y) {
    const definition = this.data.enemies[enemyId];
    if (!definition) return null;
    const enemy = this.enemyPool.acquire({
      id: `${enemyId}:${this.entitySequence += 1}`,
      typeId: enemyId,
      definition: scaleEnemyDefinition(definition, this.difficulty.enemyHpMultiplier ?? 1),
      x,
      y,
    });
    this.patternRunner.attach(enemy);
    return enemy;
  }

  resolveCollisions() {
    this.bulletPool.forEachActive((bullet) => {
      if (bullet.team !== 'player') return;
      this.enemyPool.forEachActive((enemy) => {
        if (!bullet.active || !enemy.active) return;
        if (circlesOverlap(bullet.x, bullet.y, bullet.hitboxRadius, enemy.x, enemy.y, enemy.hitboxRadius)) {
          bullet.active = false;
          if (enemy.takeDamage(bullet.damage)) {
            this.destroyEnemy(enemy);
          } else if (enemy.phaseChanged) {
            this.patternRunner.detach(enemy);
            this.patternRunner.attach(enemy);
            enemy.phaseChanged = false;
            this.clearEnemyBullets();
            this.emit('sound', { id: 'se_boss_phase', volume: 0.8 });
            this.emit('phaseChange', { enemy, phase: enemy.definition.phases?.[enemy.phaseIndex] });
            this.emit('explosion', { x: enemy.x, y: enemy.y, boss: true });
          } else {
            this.emit('hit', { x: bullet.x, y: bullet.y, color: '#ffffff' });
          }
        }
      });
    });

    this.bulletPool.forEachActive((bullet) => {
      if (bullet.team !== 'enemy' || !this.player.active) return;
      const grazeRadius = this.player.hitboxRadius + bullet.hitboxRadius + 17;
      if (bullet.graze && !bullet.grazed && circlesOverlap(bullet.x, bullet.y, grazeRadius, this.player.x, this.player.y, 0)) {
        bullet.grazed = true;
        this.player.addGraze();
        this.emit('sound', { id: 'se_graze', volume: 0.32 });
        this.emit('graze', { x: bullet.x, y: bullet.y });
      }
      if (this.player.canBeHit() && circlesOverlap(bullet.x, bullet.y, bullet.hitboxRadius, this.player.x, this.player.y, this.player.hitboxRadius)) {
        bullet.active = false;
        this.damagePlayer();
      }
    });

    this.enemyPool.forEachActive((enemy) => {
      if (!this.player.canBeHit()) return;
      if (circlesOverlap(enemy.x, enemy.y, enemy.collisionRadius, this.player.x, this.player.y, this.player.hitboxRadius)) {
        this.damagePlayer();
      }
    });
  }

  damagePlayer() {
    if (!this.player.hit()) return;
    this.clearEnemyBullets();
    this.emit('sound', { id: 'se_player_hit', volume: 0.7, duckMusic: true });
    this.emit('playerHit', { x: this.player.x, y: this.player.y });
    if (this.player.lives <= 0) {
      this.state = 'gameover';
      this.stageRunner.failed = true;
      this.emit('gameOver', { score: this.player.score });
    }
  }

  destroyEnemy(enemy) {
    this.patternRunner.detach(enemy);
    this.player.addScore(enemy.definition.score ?? 0);
    this.emit('sound', { id: 'se_enemy_destroy', volume: enemy.isMajorEnemy ? 0.9 : 0.45 });
    this.emit('explosion', { x: enemy.x, y: enemy.y, boss: enemy.isMajorEnemy });
    if (enemy.isMajorEnemy) this.clearEnemyBullets();
  }

  clearEnemyBullets() {
    let canceled = 0;
    this.bulletPool.forEachActive((bullet) => {
      if (bullet.team === 'enemy' && bullet.cancelable) {
        bullet.active = false;
        canceled += 1;
      }
    });
    this.emit('bulletClear', { canceled });
    return canceled;
  }

  applyBombPulse() {
    let cleared = 0;
    const targets = [...this.enemyPool.activeItems];
    for (const enemy of targets) {
      if (!enemy.active) continue;
      if (enemy.isMajorEnemy) {
        if (enemy.takeDamage(34)) {
          this.destroyEnemy(enemy);
        } else if (enemy.phaseChanged) {
          this.patternRunner.detach(enemy);
          this.patternRunner.attach(enemy);
          enemy.phaseChanged = false;
          this.emit('sound', { id: 'se_boss_phase', volume: 0.72 });
          this.emit('phaseChange', { enemy, phase: enemy.definition.phases?.[enemy.phaseIndex] });
        } else {
          this.emit('hit', { x: enemy.x, y: enemy.y, color: '#c8f7ff' });
        }
        continue;
      }
      enemy.active = false;
      this.destroyEnemy(enemy);
      cleared += 1;
    }
    return cleared;
  }

  pause() {
    if (this.state === 'playing') this.state = 'paused';
  }

  resume() {
    if (this.state === 'paused') this.state = 'playing';
  }

  get enemyCount() {
    return this.enemyPool.countActive();
  }

  get enemies() {
    return this.enemyPool.activeItems;
  }

  get bullets() {
    return this.bulletPool.activeItems;
  }

  get stats() {
    return {
      score: this.player.score,
      lives: this.player.lives,
      bombs: this.player.bombs,
      graze: this.player.graze,
      enemyCount: this.enemyCount,
      bulletCount: this.bulletPool.countActive(),
      stageTime: this.stageRunner?.elapsed ?? 0,
      difficulty: this.difficultyId,
    };
  }
}
