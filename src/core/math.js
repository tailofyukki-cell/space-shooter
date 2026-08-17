export const TAU = Math.PI * 2;

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function degToRad(degrees) {
  return (degrees * Math.PI) / 180;
}

export function vectorFromAngle(angleDegrees, speed = 1) {
  const radians = degToRad(angleDegrees);
  return {
    x: Math.cos(radians) * speed,
    y: Math.sin(radians) * speed,
  };
}

export function angleBetween(fromX, fromY, toX, toY) {
  return (Math.atan2(toY - fromY, toX - fromX) * 180) / Math.PI;
}

export function distanceSquared(ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  return dx * dx + dy * dy;
}

export function circlesOverlap(ax, ay, ar, bx, by, br) {
  const radius = ar + br;
  return distanceSquared(ax, ay, bx, by) <= radius * radius;
}

export class SeededRandom {
  constructor(seed = Date.now()) {
    this.state = seed >>> 0;
  }

  next() {
    let value = (this.state += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  }

  range(min, max) {
    return min + (max - min) * this.next();
  }

  int(min, maxInclusive) {
    return Math.floor(this.range(min, maxInclusive + 1));
  }
}
