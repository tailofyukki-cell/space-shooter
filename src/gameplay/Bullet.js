export class Bullet {
  constructor() {
    this.active = false;
  }

  reset({ definition, x, y, vx, vy, ownerId = null }) {
    this.active = true;
    this.definition = definition;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.ownerId = ownerId;
    this.radius = definition.radius ?? 6;
    this.hitboxRadius = definition.hitboxRadius ?? this.radius;
    this.damage = definition.damage ?? 1;
    this.team = definition.team;
    this.graze = Boolean(definition.graze);
    this.cancelable = Boolean(definition.cancelable);
    this.grazed = false;
    this.age = 0;
  }

  update(dt, bounds) {
    if (!this.active) return;
    this.age += dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    const margin = 80;
    if (
      this.x < -margin ||
      this.x > bounds.width + margin ||
      this.y < -margin ||
      this.y > bounds.height + margin
    ) {
      this.active = false;
    }
  }
}
