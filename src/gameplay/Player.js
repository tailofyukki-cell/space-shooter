import { clamp } from '../core/math.js';

export class Player {
  constructor(definition, bounds) {
    this.definition = definition;
    this.bounds = bounds;
    this.reset();
  }

  reset() {
    this.x = this.bounds.width / 2;
    this.y = this.bounds.height - 104;
    this.lives = this.definition.lives;
    this.bombs = this.definition.bombs;
    this.score = 0;
    this.graze = 0;
    this.shotTimer = 0;
    this.invincibleTimer = 1.5;
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
    this.invincibleTimer = Math.max(this.invincibleTimer, 1.3);
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
