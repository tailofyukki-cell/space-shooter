import { clamp, lerp } from '../core/math.js';

export class Enemy {
  constructor() {
    this.active = false;
  }

  reset({ id, definition, x, y }) {
    this.active = true;
    this.id = id;
    this.definition = definition;
    this.x = x;
    this.y = y;
    this.startX = x;
    this.startY = y;
    this.age = 0;
    this.hp = definition.hp;
    this.maxHp = definition.hp;
    this.phaseIndex = 0;
    this.phaseTimer = 0;
    this.hasEntered = false;
    this.dead = false;
  }

  update(dt, bounds) {
    if (!this.active || this.dead) return;
    this.age += dt;
    this.phaseTimer += dt;
    const movement = this.definition.movement ?? { type: 'line', velocity: [0, 0] };

    if (movement.type === 'line') {
      const [vx, vy] = movement.velocity ?? [0, 0];
      this.x += vx * dt;
      this.y += vy * dt;
    } else if (movement.type === 'sine') {
      const [vx, vy] = movement.velocity ?? [0, 0];
      const amplitude = movement.amplitude ?? 60;
      const frequency = movement.frequency ?? 1;
      this.x = this.startX + Math.sin(this.age * frequency * Math.PI * 2) * amplitude + vx * this.age;
      this.y = this.startY + vy * this.age;
    } else if (movement.type === 'hover') {
      const [targetX, targetY] = movement.target ?? [bounds.width / 2, 120];
      const travel = clamp(this.age / 1.1, 0, 1);
      this.x = lerp(this.startX, targetX, travel);
      this.y = lerp(this.startY, targetY, travel);
      this.hasEntered = travel >= 1;
    }

    if (movement.duration && movement.duration < 900 && this.age >= movement.duration) {
      this.active = false;
    }

    if (
      this.x < -100 ||
      this.x > bounds.width + 100 ||
      this.y < -140 ||
      this.y > bounds.height + 140
    ) {
      this.active = false;
    }
  }

  takeDamage(amount) {
    if (!this.active || this.dead) return false;
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.dead = true;
      this.active = false;
      return true;
    }
    return false;
  }

  get isBoss() {
    return this.definition.kind === 'boss';
  }

  get hitboxRadius() {
    return this.definition.hitboxRadius ?? 18;
  }

  get collisionRadius() {
    return this.definition.collisionRadius ?? this.hitboxRadius;
  }

  get activePatterns() {
    if (!this.isBoss) return this.definition.patterns ?? [];
    return this.definition.phases?.[this.phaseIndex]?.patterns ?? [];
  }
}
