import { clamp } from '../core/math.js';

export class Player {
  constructor(definition, bounds) {
    this.definition = definition;
    this.bounds = bounds;
    this.reset();
  }

  reset({ lives, bombs, score = 0, graze = 0, invincibility } = {}) {
    const [spawnX, spawnY] = this.definition.spawn ?? [this.bounds.width / 2, this.bounds.height - 104];
    this.x = clamp(spawnX, 18, this.bounds.width - 18);
    this.y = clamp(spawnY, 28, this.bounds.height - 24);
    this.lives = Number.isFinite(lives) ? lives : this.definition.lives;
    this.bombs = Number.isFinite(bombs) ? bombs : this.definition.bombs;
    this.score = Number.isFinite(score) ? score : 0;
    this.graze = Number.isFinite(graze) ? graze : 0;
    this.shotTimer = 0;
    this.invincibleTimer = Number.isFinite(invincibility) ? invincibility : 1.5;
    this.bombTimer = 0;
    this.focused = false;
    this.active = true;
  }

  update(dt, input, spawnShot) {
    if (!this.active) return;
    this.focused = input.isDown('focus');
    const move = input.getMoveVector();
    const speed = this.focused ? this.definition.focusSpeed : this.definition.moveSpeed;
    this.x = clamp(this.x + move.x * speed * dt, 18, this.bounds.width - 18);
    this.y = clamp(this.y + move.y * speed * dt, 28, this.bounds.height - 24);

    this.shotTimer = Math.max(0, this.shotTimer - dt);
    if (input.isDown('shot') && this.shotTimer <= 0) {
      const shotSet = this.focused ? this.definition.focusShots : this.definition.shots;
      const interval = Math.min(...shotSet.map((shot) => shot.interval));
      for (const shot of shotSet) spawnShot(shot, this);
      this.shotTimer = interval;
    }

    this.invincibleTimer = Math.max(0, this.invincibleTimer - dt);
    this.bombTimer = Math.max(0, this.bombTimer - dt);
  }

  canBeHit() {
    return this.active && this.invincibleTimer <= 0;
  }

  hit() {
    if (!this.canBeHit()) return false;
    this.lives -= 1;
    this.invincibleTimer = this.definition.respawnInvincibility ?? 2;
    return true;
  }

  useBomb() {
    if (!this.active || this.bombs <= 0) return false;
    this.bombs -= 1;
    this.bombTimer = this.definition.bombDuration ?? 1.35;
    this.invincibleTimer = Math.max(this.invincibleTimer, this.bombTimer + 0.25);
    return true;
  }

  addScore(amount) {
    this.score += Math.max(0, Math.floor(amount));
  }

  addGraze(amount = 1) {
    this.graze += amount;
    this.addScore(amount * 10);
  }

  get hitboxRadius() {
    return this.definition.hitboxRadius;
  }

  get pickupRadius() {
    return this.definition.pickupRadius ?? 28;
  }
}
