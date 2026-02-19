// ========================================
// Canvas Setup
// ========================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Canvas size
canvas.width = 800;
canvas.height = 600;

// ========================================
// Game State
// ========================================
const GameState = {
    TITLE: 'title',
    PLAYING: 'playing',
    GAMEOVER: 'gameover',
    CLEAR: 'clear'
};

let currentState = GameState.TITLE;
let score = 0;
let life = 3;
let gameTime = 0;
let lastTime = 0;

// ========================================
// Input Handling
// ========================================
const keys = {};
let mouseX = 0;
let mouseY = 0;
let isMouseDown = false;
let isTouchDevice = false;

window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

canvas.addEventListener('mousedown', (e) => {
    isMouseDown = true;
    updateMousePosition(e);
});

canvas.addEventListener('mouseup', () => {
    isMouseDown = false;
});

canvas.addEventListener('mousemove', (e) => {
    updateMousePosition(e);
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    isTouchDevice = true;
    isMouseDown = true;
    updateTouchPosition(e);
});

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    isMouseDown = false;
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    updateTouchPosition(e);
});

function updateMousePosition(e) {
    const rect = canvas.getBoundingClientRect();
    mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
    mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);
}

function updateTouchPosition(e) {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    mouseX = (touch.clientX - rect.left) * (canvas.width / rect.width);
    mouseY = (touch.clientY - rect.top) * (canvas.height / rect.height);
}

// ========================================
// Game Objects
// ========================================

// Player
const player = {
    x: 100,
    y: canvas.height / 2,
    width: 30,
    height: 20,
    speed: 300,
    shootCooldown: 0,
    shootDelay: 0.15,
    powerUp: false,
    
    update(deltaTime) {
        // Movement
        if (keys['w'] || keys['ArrowUp']) this.y -= this.speed * deltaTime;
        if (keys['s'] || keys['ArrowDown']) this.y += this.speed * deltaTime;
        if (keys['a'] || keys['ArrowLeft']) this.x -= this.speed * deltaTime;
        if (keys['d'] || keys['ArrowRight']) this.x += this.speed * deltaTime;
        
        // Touch/Mouse movement
        if (isTouchDevice && isMouseDown) {
            const dx = mouseX - this.x;
            const dy = mouseY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 5) {
                this.x += (dx / distance) * this.speed * deltaTime;
                this.y += (dy / distance) * this.speed * deltaTime;
            }
        }
        
        // Boundaries
        this.x = Math.max(0, Math.min(canvas.width - this.width, this.x));
        this.y = Math.max(0, Math.min(canvas.height - this.height, this.y));
        
        // Shooting
        this.shootCooldown -= deltaTime;
        if ((keys[' '] || isMouseDown) && this.shootCooldown <= 0) {
            this.shoot();
            this.shootCooldown = this.shootDelay;
        }
    },
    
    shoot() {
        if (this.powerUp) {
            bullets.push(new Bullet(this.x + this.width, this.y + 5, 500, 0));
            bullets.push(new Bullet(this.x + this.width, this.y + this.height - 5, 500, 0));
        } else {
            bullets.push(new Bullet(this.x + this.width, this.y + this.height / 2, 500, 0));
        }
    },
    
    draw() {
        // Player ship (triangle)
        ctx.fillStyle = '#00ffff';
        ctx.beginPath();
        ctx.moveTo(this.x + this.width, this.y + this.height / 2);
        ctx.lineTo(this.x, this.y);
        ctx.lineTo(this.x, this.y + this.height);
        ctx.closePath();
        ctx.fill();
        
        // Glow effect
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
    },
    
    reset() {
        this.x = 100;
        this.y = canvas.height / 2;
        this.powerUp = false;
        this.shootCooldown = 0;
    }
};

// Bullet
class Bullet {
    constructor(x, y, speedX, speedY) {
        this.x = x;
        this.y = y;
        this.speedX = speedX;
        this.speedY = speedY;
        this.width = 10;
        this.height = 4;
        this.active = true;
    }
    
    update(deltaTime) {
        this.x += this.speedX * deltaTime;
        this.y += this.speedY * deltaTime;
        
        if (this.x > canvas.width || this.x < 0 || this.y > canvas.height || this.y < 0) {
            this.active = false;
        }
    }
    
    draw() {
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(this.x, this.y - this.height / 2, this.width, this.height);
    }
}

// Enemy
class Enemy {
    constructor(type) {
        this.type = type;
        this.x = canvas.width;
        this.y = Math.random() * (canvas.height - 40) + 20;
        this.width = 30;
        this.height = 30;
        this.speed = 150 + Math.random() * 100;
        this.active = true;
        this.shootCooldown = 1 + Math.random() * 2;
        this.hp = type === 'wave' ? 2 : 1;
        this.time = 0;
        this.amplitude = 100;
        this.frequency = 2;
        this.startY = this.y;
    }
    
    update(deltaTime) {
        this.time += deltaTime;
        this.x -= this.speed * deltaTime;
        
        if (this.type === 'wave') {
            this.y = this.startY + Math.sin(this.time * this.frequency) * this.amplitude;
        }
        
        // Boundaries
        this.y = Math.max(0, Math.min(canvas.height - this.height, this.y));
        
        if (this.x < -this.width) {
            this.active = false;
        }
        
        // Shooting
        this.shootCooldown -= deltaTime;
        if (this.shootCooldown <= 0) {
            enemyBullets.push(new Bullet(this.x, this.y + this.height / 2, -300, 0));
            this.shootCooldown = 2 + Math.random() * 2;
        }
    }
    
    draw() {
        if (this.type === 'wave') {
            ctx.fillStyle = '#ff00ff';
        } else {
            ctx.fillStyle = '#ff0000';
        }
        
        // Enemy ship (square)
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
    
    takeDamage() {
        this.hp--;
        if (this.hp <= 0) {
            this.active = false;
            score += this.type === 'wave' ? 200 : 100;
            
            // Power-up drop chance
            if (Math.random() < 0.1) {
                powerUps.push(new PowerUp(this.x, this.y));
            }
            
            // Explosion effect
            particles.push(...createExplosion(this.x + this.width / 2, this.y + this.height / 2));
        }
    }
}

// Power-up
class PowerUp {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.speed = 100;
        this.active = true;
    }
    
    update(deltaTime) {
        this.x -= this.speed * deltaTime;
        
        if (this.x < -this.width) {
            this.active = false;
        }
    }
    
    draw() {
        ctx.fillStyle = '#00ff00';
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // P letter
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('P', this.x + this.width / 2, this.y + this.height / 2);
    }
}

// Particle
class Particle {
    constructor(x, y, speedX, speedY, color) {
        this.x = x;
        this.y = y;
        this.speedX = speedX;
        this.speedY = speedY;
        this.color = color;
        this.life = 1;
        this.decay = 2;
        this.size = 3;
    }
    
    update(deltaTime) {
        this.x += this.speedX * deltaTime;
        this.y += this.speedY * deltaTime;
        this.life -= this.decay * deltaTime;
    }
    
    draw() {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.globalAlpha = 1;
    }
    
    isAlive() {
        return this.life > 0;
    }
}

function createExplosion(x, y) {
    const particles = [];
    for (let i = 0; i < 20; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 100 + Math.random() * 100;
        particles.push(new Particle(
            x, y,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            `hsl(${Math.random() * 60 + 10}, 100%, 50%)`
        ));
    }
    return particles;
}

// ========================================
// Game Arrays
// ========================================
let bullets = [];
let enemyBullets = [];
let enemies = [];
let powerUps = [];
let particles = [];

let enemySpawnTimer = 0;
let enemySpawnInterval = 2;

// ========================================
// Collision Detection
// ========================================
function checkCollision(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}

// ========================================
// Background
// ========================================
let stars = [];
for (let i = 0; i < 100; i++) {
    stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: 50 + Math.random() * 100,
        size: Math.random() * 2
    });
}

function updateBackground(deltaTime) {
    stars.forEach(star => {
        star.x -= star.speed * deltaTime;
        if (star.x < 0) {
            star.x = canvas.width;
            star.y = Math.random() * canvas.height;
        }
    });
}

function drawBackground() {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#ffffff';
    stars.forEach(star => {
        ctx.fillRect(star.x, star.y, star.size, star.size);
    });
}

// ========================================
// Game Loop
// ========================================
function update(deltaTime) {
    if (currentState !== GameState.PLAYING) return;
    
    // Update game time
    gameTime += deltaTime;
    
    // Check clear condition (60 seconds)
    if (gameTime >= 60) {
        currentState = GameState.CLEAR;
        showResultScreen('STAGE CLEAR!');
        return;
    }
    
    // Update background
    updateBackground(deltaTime);
    
    // Update player
    player.update(deltaTime);
    
    // Update bullets
    bullets.forEach(bullet => bullet.update(deltaTime));
    bullets = bullets.filter(bullet => bullet.active);
    
    // Update enemy bullets
    enemyBullets.forEach(bullet => bullet.update(deltaTime));
    enemyBullets = enemyBullets.filter(bullet => bullet.active);
    
    // Spawn enemies
    enemySpawnTimer += deltaTime;
    if (enemySpawnTimer >= enemySpawnInterval) {
        const type = Math.random() < 0.5 ? 'straight' : 'wave';
        enemies.push(new Enemy(type));
        enemySpawnTimer = 0;
        
        // Increase difficulty
        enemySpawnInterval = Math.max(0.5, 2 - gameTime * 0.02);
    }
    
    // Update enemies
    enemies.forEach(enemy => enemy.update(deltaTime));
    enemies = enemies.filter(enemy => enemy.active);
    
    // Update power-ups
    powerUps.forEach(powerUp => powerUp.update(deltaTime));
    powerUps = powerUps.filter(powerUp => powerUp.active);
    
    // Update particles
    particles.forEach(particle => particle.update(deltaTime));
    particles = particles.filter(particle => particle.isAlive());
    
    // Collision: bullets vs enemies
    bullets.forEach(bullet => {
        enemies.forEach(enemy => {
            if (bullet.active && enemy.active && checkCollision(bullet, enemy)) {
                bullet.active = false;
                enemy.takeDamage();
            }
        });
    });
    
    // Collision: player vs enemies
    enemies.forEach(enemy => {
        if (enemy.active && checkCollision(player, enemy)) {
            enemy.active = false;
            life--;
            particles.push(...createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2));
            
            if (life <= 0) {
                currentState = GameState.GAMEOVER;
                showResultScreen('GAME OVER');
            }
        }
    });
    
    // Collision: player vs enemy bullets
    enemyBullets.forEach(bullet => {
        if (bullet.active && checkCollision(player, bullet)) {
            bullet.active = false;
            life--;
            particles.push(...createExplosion(player.x + player.width / 2, player.y + player.height / 2));
            
            if (life <= 0) {
                currentState = GameState.GAMEOVER;
                showResultScreen('GAME OVER');
            }
        }
    });
    
    // Collision: player vs power-ups
    powerUps.forEach(powerUp => {
        if (powerUp.active && checkCollision(player, powerUp)) {
            powerUp.active = false;
            player.powerUp = true;
            setTimeout(() => { player.powerUp = false; }, 10000);
        }
    });
    
    // Update UI
    updateUI();
}

function draw() {
    drawBackground();
    
    if (currentState !== GameState.PLAYING) return;
    
    // Draw game objects
    player.draw();
    bullets.forEach(bullet => bullet.draw());
    enemyBullets.forEach(bullet => bullet.draw());
    enemies.forEach(enemy => enemy.draw());
    powerUps.forEach(powerUp => powerUp.draw());
    particles.forEach(particle => particle.draw());
}

function gameLoop(timestamp) {
    const deltaTime = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;
    
    update(deltaTime);
    draw();
    
    requestAnimationFrame(gameLoop);
}

// ========================================
// UI Functions
// ========================================
function updateUI() {
    document.getElementById('score').textContent = score;
    document.getElementById('life').textContent = life;
    document.getElementById('time').textContent = Math.floor(gameTime);
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.add('hidden');
    });
    document.getElementById(screenId).classList.remove('hidden');
}

function showResultScreen(title) {
    document.getElementById('result-title').textContent = title;
    document.getElementById('final-score').textContent = score;
    showScreen('result-screen');
}

function startGame() {
    currentState = GameState.PLAYING;
    score = 0;
    life = 3;
    gameTime = 0;
    enemySpawnTimer = 0;
    enemySpawnInterval = 2;
    
    bullets = [];
    enemyBullets = [];
    enemies = [];
    powerUps = [];
    particles = [];
    
    player.reset();
    
    showScreen('game-ui');
    updateUI();
}

// ========================================
// Event Listeners
// ========================================
document.getElementById('start-button').addEventListener('click', startGame);
document.getElementById('retry-button').addEventListener('click', startGame);
document.getElementById('title-button').addEventListener('click', () => {
    currentState = GameState.TITLE;
    showScreen('title-screen');
});

// ========================================
// Initialize
// ========================================
showScreen('title-screen');
requestAnimationFrame(gameLoop);
