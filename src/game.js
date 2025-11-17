// Simple Mario-style 2D runner implemented with canvas and ES6 modules

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score-value');
const restartBtn = document.getElementById('restart-btn');

// Game constants
const GROUND_Y = canvas.height - 60;
const GRAVITY = 0.5;
const JUMP_FORCE = -11;
const OBSTACLE_MIN_GAP = 80; // min space between obstacles
const OBSTACLE_MAX_GAP = 200;
const INITIAL_SPEED = 6;

// Player state
const player = {
  x: 80,
  y: GROUND_Y,
  width: 32,
  height: 40,
  vy: 0,
  onGround: true,
};

// Obstacles array
let obstacles = [];

// Game state
let speed = INITIAL_SPEED;
let score = 0;
let lastTime = 0;
let gameOver = false;
let spawnTimer = 0;

function resetGame() {
  player.y = GROUND_Y;
  player.vy = 0;
  player.onGround = true;
  obstacles = [];
  speed = INITIAL_SPEED;
  score = 0;
  scoreEl.textContent = '0';
  spawnTimer = 0;
  lastTime = 0;
  gameOver = false;
}

function spawnObstacle() {
  const height = 40 + Math.random() * 30;
  const width = 20 + Math.random() * 20;

  obstacles.push({
    x: canvas.width + 20,
    y: GROUND_Y + (player.height - height),
    width,
    height,
  });
}

function update(delta) {
  if (gameOver) return;

  // Increase difficulty slowly over time
  speed += delta * 0.0005;

  // Apply gravity
  player.vy += GRAVITY;
  player.y += player.vy;

  if (player.y >= GROUND_Y) {
    player.y = GROUND_Y;
    player.vy = 0;
    player.onGround = true;
  }

  // Update obstacles
  spawnTimer -= delta;
  if (spawnTimer <= 0) {
    spawnObstacle();
    spawnTimer = OBSTACLE_MIN_GAP + Math.random() * (OBSTACLE_MAX_GAP - OBSTACLE_MIN_GAP);
  }

  obstacles.forEach((ob) => {
    ob.x -= speed;
  });

  // Remove off-screen obstacles
  obstacles = obstacles.filter((ob) => ob.x + ob.width > 0);

  // Collision detection (simple AABB)
  for (const ob of obstacles) {
    if (
      player.x < ob.x + ob.width &&
      player.x + player.width > ob.x &&
      player.y < ob.y + ob.height &&
      player.y + player.height > ob.y
    ) {
      gameOver = true;
      break;
    }
  }

  // Update score
  score += delta * 0.01; // scaled for readability
  scoreEl.textContent = Math.floor(score).toString();
}

function drawBackground() {
  // sky is handled by canvas background via CSS

  // ground line
  ctx.fillStyle = '#2f5d1f';
  ctx.fillRect(0, GROUND_Y + player.height, canvas.width, 40);

  // draw some simple clouds
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  const cloudY = 70;
  for (let i = 0; i < 3; i++) {
    const offset = (i * 220 + (Date.now() * 0.03)) % (canvas.width + 100) - 100;
    ctx.beginPath();
    ctx.ellipse(offset, cloudY, 40, 20, 0, 0, Math.PI * 2);
    ctx.ellipse(offset + 25, cloudY - 10, 30, 18, 0, 0, Math.PI * 2);
    ctx.ellipse(offset - 25, cloudY - 5, 26, 16, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlayer() {
  // Simple Mario-like blocky character
  ctx.fillStyle = '#ffcc00';
  ctx.fillRect(player.x, player.y, player.width, player.height);

  // hat
  ctx.fillStyle = '#d62828';
  ctx.fillRect(player.x, player.y - 8, player.width, 10);
}

function drawObstacles() {
  ctx.fillStyle = '#6c757d';
  obstacles.forEach((ob) => {
    ctx.fillRect(ob.x, ob.y, ob.width, ob.height);
  });
}

function drawGameOver() {
  if (!gameOver) return;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 32px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 10);
  ctx.font = '18px system-ui, sans-serif';
  ctx.fillText('Press Restart to play again', canvas.width / 2, canvas.height / 2 + 20);
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  drawObstacles();
  drawPlayer();
  drawGameOver();
}

function loop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const delta = timestamp - lastTime;
  lastTime = timestamp;

  update(delta);
  render();

  requestAnimationFrame(loop);
}

function handleJump() {
  if (!gameOver && player.onGround) {
    player.vy = JUMP_FORCE;
    player.onGround = false;
  }
}

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.code === 'ArrowUp') {
    e.preventDefault();
    handleJump();
  }
});

restartBtn.addEventListener('click', () => {
  resetGame();
});

resetGame();
requestAnimationFrame(loop);
