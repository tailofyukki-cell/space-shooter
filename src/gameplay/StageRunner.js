export class StageRunner {
  constructor(stageDefinition) {
    this.stage = stageDefinition;
    this.reset();
  }

  reset() {
    this.elapsed = 0;
    this.cursor = 0;
    this.started = false;
    this.completed = false;
    this.failed = false;
    this.boss = null;
  }

  start(world) {
    this.reset();
    this.started = true;
    if (this.stage.music) world.emit('music', { id: this.stage.music });
    world.emit('stageStart', { stage: this.stage });
  }

  update(dt, world) {
    if (!this.started || this.completed || this.failed) return;
    this.elapsed += dt;

    const timeline = this.stage.timeline ?? [];
    while (this.cursor < timeline.length && timeline[this.cursor].at <= this.elapsed) {
      this.execute(timeline[this.cursor], world);
      this.cursor += 1;
    }

    const clearRule = this.stage.clear ?? { type: 'timelineEnd' };
    if (clearRule.type === 'bossDefeat' && this.boss && !this.boss.active && this.boss.dead) {
      this.completed = true;
      world.emit('stageClear', { stage: this.stage });
    }
    if (clearRule.type === 'survive' && this.elapsed >= clearRule.duration) {
      this.completed = true;
      world.emit('stageClear', { stage: this.stage });
    }
    if (clearRule.type === 'timelineEnd' && this.cursor >= timeline.length && world.enemyCount === 0) {
      this.completed = true;
      world.emit('stageClear', { stage: this.stage });
    }
  }

  execute(event, world) {
    if (event.type === 'spawn') {
      world.spawnEnemy(event.enemy, event.x, event.y);
    } else if (event.type === 'midboss') {
      const midboss = world.spawnEnemy(event.enemy, event.x, event.y);
      world.emit('midbossStart', { midboss });
    } else if (event.type === 'boss') {
      this.boss = world.spawnEnemy(event.enemy, event.x, event.y);
      world.emit('bossStart', { boss: this.boss });
    } else if (event.type === 'music') {
      world.emit('music', { id: event.track });
    } else if (event.type === 'announce') {
      world.emit('announce', { textKey: event.textKey });
    }
  }
}
