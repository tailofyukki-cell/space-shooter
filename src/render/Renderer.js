import { SeededRandom, TAU } from '../core/math.js';

export class Renderer {
  constructor(canvas, data) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.display = data.manifest.display;
    this.scrollAxis = data.manifest.gameplay?.scrollAxis ?? 'vertical';
    this.brandTitle = data.manifest.title;
    this.brandSubtitle = data.text['game.subtitle'] ?? data.manifest.version;
    this.canvas.width = this.display.width;
    this.canvas.height = this.display.height;
    this.fieldX = (this.display.width - this.display.fieldWidth) / 2;
    this.fieldY = (this.display.height - this.display.fieldHeight) / 2;
    this.visuals = data.manifest.visuals ?? {};
    this.images = new Map();
    this.backgroundOffset = 0;
    this.backgroundSpeed = 24;
    this.stars = [];
    this.particles = [];
    this.seedStars();
    this.loadVisuals();
  }

  loadVisuals() {
    if (this.visuals.background) this.loadImage('background', this.visuals.background);
    for (const [key, source] of Object.entries(this.visuals.sprites ?? {})) {
      this.loadImage(`sprite:${key}`, source);
    }
  }

  loadImage(key, source) {
    if (typeof Image === 'undefined' || !source) return;
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => this.images.set(key, image);
    image.onerror = () => {};
    image.src = encodeURI(source);
  }

  seedStars() {
    const random = new SeededRandom(30281);
    this.stars = Array.from({ length: 118 }, () => ({
      x: random.range(0, this.display.fieldWidth),
      y: random.range(0, this.display.fieldHeight),
      size: random.range(0.7, 2.2),
      speed: random.range(18, 85),
      alpha: random.range(0.18, 0.86),
    }));
  }

  update(dt) {
    if (this.scrollAxis === 'horizontal') {
      this.backgroundOffset = (this.backgroundOffset + this.backgroundSpeed * dt) % this.display.fieldWidth;
    }
    for (const star of this.stars) {
      if (this.scrollAxis === 'horizontal') {
        star.x -= star.speed * dt;
        if (star.x < -5) {
          star.x = this.display.fieldWidth + 5;
          star.y = (star.y * 71.23 + 137) % this.display.fieldHeight;
        }
      } else {
        star.y += star.speed * dt;
        if (star.y > this.display.fieldHeight + 5) {
          star.y = -5;
          star.x = (star.x * 73.17 + 211) % this.display.fieldWidth;
        }
      }
    }
    for (const particle of this.particles) {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vx *= 0.96;
      particle.vy *= 0.96;
      particle.life -= dt;
    }
    this.particles = this.particles.filter((particle) => particle.life > 0);
  }

  burst(x, y, { color = '#ffffff', count = 18, power = 110 } = {}) {
    const random = new SeededRandom(Math.floor(x * 31 + y * 17 + this.particles.length));
    for (let index = 0; index < count; index += 1) {
      const angle = random.range(0, TAU);
      const speed = random.range(power * 0.35, power);
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: random.range(1.5, 4),
        life: random.range(0.28, 0.75),
        maxLife: 0.75,
        color,
      });
    }
  }

  render(world) {
    const ctx = this.ctx;
    this.backgroundSpeed = world.background?.scrollSpeed ?? this.backgroundSpeed;
    this.drawBackdrop(ctx);
    this.drawField(ctx, world);
    this.drawSidePanels(ctx, world);
  }

  drawBackdrop(ctx) {
    const gradient = ctx.createLinearGradient(0, 0, this.display.width, this.display.height);
    gradient.addColorStop(0, '#050818');
    gradient.addColorStop(0.5, '#0b1030');
    gradient.addColorStop(1, '#170827');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.display.width, this.display.height);

    const scanline = ctx.createLinearGradient(0, 0, 0, 10);
    scanline.addColorStop(0, 'rgba(122, 241, 255, 0.035)');
    scanline.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
    scanline.addColorStop(1, 'rgba(0, 0, 0, 0.04)');
    ctx.fillStyle = scanline;
    for (let y = 0; y < this.display.height; y += 10) ctx.fillRect(0, y, this.display.width, 10);
  }

  drawField(ctx, world) {
    const { fieldWidth, fieldHeight } = this.display;
    ctx.save();
    ctx.translate(this.fieldX, this.fieldY);

    const background = world.background ?? {};
    const fieldGradient = ctx.createLinearGradient(0, 0, 0, fieldHeight);
    fieldGradient.addColorStop(0, background.primaryColor ?? '#071638');
    fieldGradient.addColorStop(1, background.secondaryColor ?? '#1f0c3c');
    ctx.fillStyle = fieldGradient;
    ctx.fillRect(0, 0, fieldWidth, fieldHeight);

    const backgroundImage = this.images.get('background');
    if (backgroundImage) {
      // Stage artwork is intentionally non-seamless. Keep it stable and use the star layer
      // for motion so a hard duplicate seam never crosses the bullet-dense play space.
      ctx.globalAlpha = 0.92;
      ctx.drawImage(backgroundImage, 0, 0, fieldWidth, fieldHeight);
      ctx.globalAlpha = 1;
      const readabilityShade = ctx.createLinearGradient(0, 0, fieldWidth, 0);
      readabilityShade.addColorStop(0, 'rgba(1, 8, 27, 0.28)');
      readabilityShade.addColorStop(0.48, 'rgba(1, 8, 27, 0.08)');
      readabilityShade.addColorStop(1, 'rgba(1, 8, 27, 0.16)');
      ctx.fillStyle = readabilityShade;
      ctx.fillRect(0, 0, fieldWidth, fieldHeight);
    }

    for (const star of this.stars) {
      ctx.globalAlpha = star.alpha;
      ctx.fillStyle = '#eafcff';
      ctx.fillRect(star.x, star.y, star.size, star.size);
    }
    ctx.globalAlpha = 1;

    const haze = ctx.createRadialGradient(fieldWidth / 2, 200, 5, fieldWidth / 2, 260, fieldWidth * 0.8);
    haze.addColorStop(0, 'rgba(110, 128, 255, 0.11)');
    haze.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, fieldWidth, fieldHeight);

    this.drawParticles(ctx);
    for (const bullet of world.bullets) this.drawBullet(ctx, bullet);
    for (const enemy of world.enemies) this.drawEnemy(ctx, enemy);
    this.drawPlayer(ctx, world.player);

    ctx.strokeStyle = 'rgba(150, 246, 255, 0.75)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, fieldWidth - 2, fieldHeight - 2);
    ctx.restore();

    this.drawBossGauge(ctx, world);
  }

  drawBullet(ctx, bullet) {
    const { definition } = bullet;
    ctx.save();
    ctx.translate(bullet.x, bullet.y);
    ctx.shadowBlur = 12;
    ctx.shadowColor = definition.glowColor ?? definition.color;
    ctx.fillStyle = definition.color;
    if (definition.shape === 'needle') {
      ctx.rotate(Math.atan2(bullet.vy, bullet.vx));
      ctx.beginPath();
      ctx.moveTo(13, 0);
      ctx.lineTo(-8, -4);
      ctx.lineTo(-8, 4);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, bullet.radius, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-bullet.radius * 0.22, -bullet.radius * 0.22, bullet.radius * 0.32, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  drawEnemy(ctx, enemy) {
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    const sprite = this.images.get(`sprite:${enemy.id}`);
    if (sprite) {
      const sizes = {
        pollen_scout: [56, 42],
        petal_wisp: [68, 56],
        crystal_gardener: [96, 80],
        flora_orbis: [190, 152],
      };
      const [width, height] = sizes[enemy.id] ?? (enemy.isBoss ? [190, 152] : [64, 52]);
      if (!enemy.isBoss) ctx.rotate(Math.sin(enemy.age * 3) * 0.045);
      ctx.shadowBlur = enemy.isBoss ? 17 : 9;
      ctx.shadowColor = enemy.definition.color ?? '#ffffff';
      ctx.drawImage(sprite, -width / 2, -height / 2, width, height);
      ctx.restore();
      return;
    }
    const color = enemy.definition.color ?? '#ff7093';
    ctx.shadowBlur = enemy.isBoss ? 24 : 12;
    ctx.shadowColor = color;
    ctx.fillStyle = color;
    ctx.strokeStyle = '#fff3ff';
    ctx.lineWidth = enemy.isBoss ? 3 : 2;

    if (enemy.isBoss) {
      ctx.beginPath();
      for (let index = 0; index < 8; index += 1) {
        const angle = -Math.PI / 2 + (TAU * index) / 8;
        const radius = index % 2 === 0 ? 46 : 28;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, TAU);
      ctx.fill();
    } else {
      ctx.rotate(Math.sin(enemy.age * 3) * 0.15);
      ctx.beginPath();
      ctx.moveTo(0, 22);
      ctx.lineTo(-18, -14);
      ctx.lineTo(0, -23);
      ctx.lineTo(18, -14);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  drawPlayer(ctx, player) {
    if (!player.active) return;
    const flicker = player.invincibleTimer > 0 && Math.floor(player.invincibleTimer * 18) % 2 === 0;
    if (flicker) return;

    ctx.save();
    ctx.translate(player.x, player.y);
    const sprite = this.images.get('sprite:player');
    if (sprite) {
      ctx.shadowBlur = 13;
      ctx.shadowColor = '#72f7ff';
      ctx.drawImage(sprite, -38, -24, 76, 48);
      if (player.focused) {
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, player.hitboxRadius + 3, 0, TAU);
        ctx.stroke();
      }
      ctx.restore();
      return;
    }
    ctx.shadowBlur = 18;
    ctx.shadowColor = '#72f7ff';
    ctx.fillStyle = '#72f7ff';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (this.scrollAxis === 'horizontal') {
      ctx.moveTo(27, 0);
      ctx.lineTo(-16, -15);
      ctx.lineTo(-7, 0);
      ctx.lineTo(-16, 15);
    } else {
      ctx.moveTo(0, -25);
      ctx.lineTo(-16, 17);
      ctx.lineTo(0, 11);
      ctx.lineTo(16, 17);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#1d6cf2';
    if (this.scrollAxis === 'horizontal') ctx.fillRect(-8, -4, 18, 8);
    else ctx.fillRect(-4, -6, 8, 18);

    if (player.focused) {
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, player.hitboxRadius + 3, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawParticles(ctx) {
    ctx.save();
    for (const particle of this.particles) {
      ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
      ctx.fillStyle = particle.color;
      ctx.fillRect(particle.x - particle.size / 2, particle.y - particle.size / 2, particle.size, particle.size);
    }
    ctx.restore();
  }

  drawBossGauge(ctx, world) {
    const boss = world.enemies.find((enemy) => enemy.isBoss);
    if (!boss) return;
    const x = this.fieldX + 55;
    const y = 28;
    const width = this.display.fieldWidth - 110;
    const ratio = boss.maxHp === 0 ? 0 : boss.hp / boss.maxHp;
    ctx.save();
    ctx.font = '600 15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f6dbff';
    ctx.fillText(boss.definition.name ?? 'BOSS', this.display.width / 2, y - 8);
    ctx.fillStyle = 'rgba(10, 7, 29, 0.82)';
    ctx.fillRect(x, y, width, 11);
    ctx.fillStyle = '#d67cff';
    ctx.fillRect(x, y, width * Math.max(0, ratio), 11);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, 11);
    ctx.restore();
  }

  drawSidePanels(ctx, world) {
    const stats = world.stats;
    const leftX = 46;
    const rightX = this.display.width - 46;
    ctx.save();
    ctx.font = '700 17px system-ui, sans-serif';
    ctx.fillStyle = '#85f6ff';
    ctx.textAlign = 'left';
    ctx.fillText(this.brandTitle, leftX, 64);
    ctx.fillStyle = '#d8e7ff';
    ctx.font = '600 13px system-ui, sans-serif';
    ctx.fillText(this.brandSubtitle, leftX, 86);

    const info = [
      ['SCORE', stats.score.toString().padStart(8, '0')],
      ['LIFE', '◆'.repeat(Math.max(0, stats.lives))],
      ['BOMB', '●'.repeat(Math.max(0, stats.bombs))],
      ['GRAZE', String(stats.graze)],
    ];
    ctx.textAlign = 'right';
    let y = 118;
    for (const [label, value] of info) {
      ctx.fillStyle = '#9eb0d8';
      ctx.font = '600 12px system-ui, sans-serif';
      ctx.fillText(label, rightX, y);
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 18px ui-monospace, monospace';
      ctx.fillText(value, rightX, y + 23);
      y += 64;
    }

    ctx.fillStyle = 'rgba(135, 239, 255, 0.6)';
    ctx.font = '600 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Z / SPACE: SHOT', this.fieldX + this.display.fieldWidth / 2, this.display.height - 38);
    ctx.fillText('SHIFT: FOCUS     X: BOMB     ESC: PAUSE', this.fieldX + this.display.fieldWidth / 2, this.display.height - 18);
    ctx.restore();
  }
}
