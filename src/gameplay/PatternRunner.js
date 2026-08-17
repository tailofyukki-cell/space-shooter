import { angleBetween, vectorFromAngle } from '../core/math.js';

function getEventRepeat(event) {
  return Math.max(1, event.repeat ?? 1);
}

function getEventTime(event, index) {
  return (event.at ?? 0) + (event.interval ?? 0) * index;
}

export class PatternRunner {
  constructor(patternDefinitions) {
    this.patternDefinitions = patternDefinitions;
    this.instances = [];
  }

  attach(owner) {
    for (const patternId of owner.activePatterns) {
      const definition = this.patternDefinitions[patternId];
      if (!definition) continue;
      this.instances.push({
        owner,
        patternId,
        definition,
        elapsed: 0,
        cycle: 0,
        fired: new Set(),
      });
    }
  }

  detach(owner) {
    this.instances = this.instances.filter((instance) => instance.owner !== owner);
  }

  clear() {
    this.instances = [];
  }

  update(dt, world) {
    for (const instance of this.instances) {
      if (!instance.owner.active || instance.owner.dead) continue;
      if (instance.owner.isBoss && !instance.owner.hasEntered) continue;
      instance.elapsed += dt;
      const events = instance.definition.events ?? [];
      events.forEach((event, eventIndex) => {
        const repeat = getEventRepeat(event);
        for (let i = 0; i < repeat; i += 1) {
          const eventTime = getEventTime(event, i);
          const token = `${eventIndex}:${i}`;
          if (instance.elapsed >= eventTime && !instance.fired.has(token)) {
            instance.fired.add(token);
            this.execute(event, instance, i, world);
          }
        }
      });

      const duration = instance.definition.duration ?? 0;
      if (duration > 0 && instance.elapsed >= duration) {
        if (instance.definition.loop) {
          instance.elapsed %= duration;
          instance.cycle += 1;
          instance.fired.clear();
        } else {
          instance.finished = true;
        }
      }
    }
    this.instances = this.instances.filter((instance) => !instance.finished && instance.owner.active);
  }

  execute(event, instance, repeatIndex, world) {
    if (event.action === 'clearBullets') {
      world.clearEnemyBullets();
      return;
    }

    const owner = instance.owner;
    const player = world.player;
    let baseAngle = event.angle ?? 90;
    if (event.aimAtPlayer) {
      baseAngle = angleBetween(owner.x, owner.y, player.x, player.y);
    }

    const fire = (angle, speed = event.speed) => {
      const velocity = vectorFromAngle(angle, speed);
      world.spawnEnemyBullet({
        bulletId: event.bullet,
        x: owner.x,
        y: owner.y,
        vx: velocity.x,
        vy: velocity.y,
        ownerId: owner.id,
      });
    };

    if (event.action === 'aimed') {
      fire(angleBetween(owner.x, owner.y, player.x, player.y));
    } else if (event.action === 'fan') {
      const count = Math.max(1, event.count ?? 1);
      const spread = event.spread ?? 0;
      const start = baseAngle - spread / 2;
      const step = count === 1 ? 0 : spread / (count - 1);
      for (let index = 0; index < count; index += 1) fire(start + step * index);
    } else if (event.action === 'ring' || event.action === 'spiral') {
      const count = Math.max(1, event.count ?? 1);
      const rotation = event.action === 'spiral' ? (event.rotation ?? 0) * (repeatIndex + instance.cycle * getEventRepeat(event)) : 0;
      for (let index = 0; index < count; index += 1) {
        fire(baseAngle + rotation + (360 / count) * index);
      }
    }

    if (event.sound) world.emit('sound', { id: event.sound, volume: 0.45 });
  }
}
