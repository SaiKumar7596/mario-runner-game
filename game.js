/*
  Mario Runner - Simple 2D side-scrolling runner

  This file contains all the game logic. It is written in plain JavaScript
  and is heavily commented so that beginners can follow along.

  High-level behavior:
  - Draw a simple "Mario" rectangle on a canvas.
  - Apply gravity so Mario falls toward the ground.
  - Allow Mario to jump when the player presses the Space bar.
  - Spawn rectangular obstacles that move from right to left.
  - Increase the score over time as the player survives.
  - Detect collisions between Mario and obstacles.
  - Show "Game Over" and allow restarting by pressing the R key.
*/

// --- Canvas setup ----------------------------------------------------------

// Get a reference to the <canvas> element in index.html
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// For convenience, store the width and height
const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// --- Game world configuration ---------------------------------------------

// Ground settings
const groundHeight = 80; // height of the ground from the bottom of the canvas

// Mario (the player) settings
const mario = {
  // Start position (x,y) in pixels
  x: 80,
  y: HEIGHT - groundHeight - 60, // start on top of the ground
  width: 40,
  height: 60,
  color: "#e74c3c", // red
  velocityY: 0, // vertical speed
  jumpStrength: 14, // how strong the jump is
};

// Physics settings
const gravity = 0.7; // how quickly Mario is pulled downward

// Obstacle (Goomba-like box) settings
const obstacles = [];
const obstacleWidth = 30;
const obstacleHeight = 40;
const obstacleColor = "#8e44ad"; // purple-ish
const obstacleSpeed = 5; // how fast obstacles move to the left
let obstacleSpawnTimer = 0; // counts frames until we spawn a new obstacle
let obstacleSpawnInterval = 90; // spawn every N frames (will slowly decrease)

// Score and game state
let score = 0;
let isGameOver = false;
let lastTimestamp = 0; // for keeping time-based score

// Input tracking
let keys = {
  Space: false,
};

// --- Helper functions ------------------------------------------------------

// Reset all important state so we can restart the game cleanly
function resetGame() {
  obstacles.length = 0; // clear the array without creating a new one
  score = 0;
  isGameOver = false;
  obstacleSpawnTimer = 0;
  obstacleSpawnInterval = 90;

  mario.y = HEIGHT - groundHeight - mario.height;
  mario.velocityY = 0;

  lastTimestamp = 0;
}

// Determine if Mario is standing on the ground
function isOnGround() {
  // The ground is a flat line at HEIGHT - groundHeight.
  // We use Math.round to avoid tiny floating point errors.
  return Math.round(mario.y + mario.height) >= HEIGHT - groundHeight;
}

// Very simple rectangle collision detection
function isColliding(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

// --- Input handling --------------------------------------------------------

// Handle keydown events (when a key is pressed)
window.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    // Prevent the page from scrolling when Space is pressed
    event.preventDefault();
    keys.Space = true;
  }

  if (event.code === "KeyR") {
    // Restart the game when "R" is pressed and the game is over
    if (isGameOver) {
      resetGame();
    }
  }
});

// Handle keyup events (when a key is released)
window.addEventListener("keyup", (event) => {
  if (event.code === "Space") {
    keys.Space = false;
  }
});

// --- Game update logic -----------------------------------------------------

function update(deltaTime) {
  if (isGameOver) {
    // When the game is over, we only wait for the player to press R.
    return;
  }

  // 1) Handle jumping
  if (keys.Space && isOnGround()) {
    // Only allow jumping when Mario is on the ground
    mario.velocityY = -mario.jumpStrength;
  }

  // 2) Apply gravity to Mario's vertical velocity
  mario.velocityY += gravity;

  // 3) Move Mario vertically according to his velocity
  mario.y += mario.velocityY;

  // 4) Prevent Mario from falling through the ground
  const groundY = HEIGHT - groundHeight - mario.height;
  if (mario.y > groundY) {
    mario.y = groundY;
    mario.velocityY = 0;
  }

  // 5) Spawn obstacles over time
  obstacleSpawnTimer++;
  if (obstacleSpawnTimer >= obstacleSpawnInterval) {
    obstacleSpawnTimer = 0;

    // Create a new obstacle at the right edge of the screen
    obstacles.push({
      x: WIDTH + 10,
      y: HEIGHT - groundHeight - obstacleHeight,
      width: obstacleWidth,
      height: obstacleHeight,
      color: obstacleColor,
    });

    // Slightly speed up spawning over time to increase difficulty,
    // but don't let the interval get too small.
    if (obstacleSpawnInterval > 45) {
      obstacleSpawnInterval -= 1;
    }
  }

  // 6) Move obstacles to the left and remove off-screen ones
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obstacle = obstacles[i];
    obstacle.x -= obstacleSpeed;

    // Remove obstacle if it goes completely off the left side of the screen
    if (obstacle.x + obstacle.width < 0) {
      obstacles.splice(i, 1);
    }
  }

  // 7) Check for collisions between Mario and all obstacles
  for (const obstacle of obstacles) {
    if (isColliding(mario, obstacle)) {
      isGameOver = true;
      break;
    }
  }

  // 8) Increase score based on time survived (deltaTime is in milliseconds)
  // Divide by 1000 to convert ms to seconds, then multiply by a factor
  score += deltaTime / 1000 * 10;
}

// --- Drawing logic ---------------------------------------------------------

function drawBackground() {
  // Clear the entire canvas
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  // Draw sky (already mostly covered by CSS background, but we ensure it here)
  ctx.fillStyle = "#87ceeb"; // sky blue
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Draw ground as a simple green rectangle
  ctx.fillStyle = "#27ae60"; // green
  ctx.fillRect(0, HEIGHT - groundHeight, WIDTH, groundHeight);
}

function drawMario() {
  // Draw a simple rectangular Mario with a "hat" to suggest the character
  // Body
  ctx.fillStyle = mario.color;
  ctx.fillRect(mario.x, mario.y, mario.width, mario.height);

  // Hat (a small rectangle on top of the body)
  ctx.fillStyle = "#c0392b"; // darker red
  const hatHeight = mario.height * 0.25;
  ctx.fillRect(mario.x, mario.y - hatHeight + 4, mario.width, hatHeight);
}

function drawObstacles() {
  for (const obstacle of obstacles) {
    ctx.fillStyle = obstacle.color;
    ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);

    // Add a simple "face" to make them look like enemies
    ctx.fillStyle = "#000";
    const eyeSize = 4;
    ctx.fillRect(obstacle.x + 6, obstacle.y + 10, eyeSize, eyeSize);
    ctx.fillRect(obstacle.x + obstacle.width - 6 - eyeSize, obstacle.y + 10, eyeSize, eyeSize);
  }
}

function drawScore() {
  ctx.fillStyle = "#000";
  ctx.font = "20px Segoe UI, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("Score: " + Math.floor(score), 16, 30);
}

function drawGameOver() {
  if (!isGameOver) return;

  // Semi-transparent overlay
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Game Over text
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.font = "48px Segoe UI, sans-serif";
  ctx.fillText("Game Over", WIDTH / 2, HEIGHT / 2 - 20);

  ctx.font = "20px Segoe UI, sans-serif";
  ctx.fillText("Press R to restart", WIDTH / 2, HEIGHT / 2 + 20);
}

// --- Main game loop --------------------------------------------------------

function gameLoop(timestamp) {
  // timestamp is provided by requestAnimationFrame and is in milliseconds
  if (!lastTimestamp) {
    lastTimestamp = timestamp;
  }
  const deltaTime = timestamp - lastTimestamp;
  lastTimestamp = timestamp;

  update(deltaTime);

  drawBackground();
  drawMario();
  drawObstacles();
  drawScore();
  drawGameOver();

  // Schedule the next frame
  window.requestAnimationFrame(gameLoop);
}

// Start the game when the page loads
resetGame();
window.requestAnimationFrame(gameLoop);
