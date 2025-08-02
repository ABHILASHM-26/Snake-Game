const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const eatSound = document.getElementById("eatSound");
const gameOverSound = document.getElementById("gameOverSound");
const bgMusic = document.getElementById("bgMusic");
const restartBtn = document.getElementById("restartBtn");
const startBtn = document.getElementById("startBtn");
const menu = document.getElementById("menu");
const aiToggle = document.getElementById("aiToggle");
const themeToggle = document.getElementById("themeToggle");
const musicToggle = document.getElementById("musicToggle");

const gridSize = 20;
const tileCount = canvas.width / gridSize;

let snake, food, dx, dy, score, gameOver, autoPlay, paused;
let highScore = localStorage.getItem("highScore") || 0;
let hue = 0;
let foodPulse = 0;
let currentTheme = "light";

function initGame() {
  snake = [{ x: 10, y: 10 }];
  food = { x: 5, y: 5 };
  dx = 1;
  dy = 0;
  score = 0;
  gameOver = false;
  paused = false;
  foodPulse = 0;
  canvas.style.display = "block";
  restartBtn.style.display = "none";
  menu.style.display = "none";
  if (!bgMusic.paused) bgMusic.play();
}

startBtn.addEventListener("click", initGame);

aiToggle.addEventListener("click", () => {
  autoPlay = !autoPlay;
  aiToggle.textContent = autoPlay ? "Disable AI Mode" : "Enable AI Mode";
});

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-theme");
  currentTheme = document.body.classList.contains("dark-theme") ? "dark" : "light";
});

musicToggle.addEventListener("click", () => {
  if (bgMusic.paused) {
    bgMusic.play();
    musicToggle.textContent = "Pause Music";
  } else {
    bgMusic.pause();
    musicToggle.textContent = "Play Music";
  }
});

restartBtn.addEventListener("click", () => {
  initGame();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "p" || e.key === "P") {
    paused = !paused;
    return;
  }

  if (autoPlay || paused || gameOver) return;

  if (e.key === "ArrowUp" && dy === 0) { dx = 0; dy = -1; }
  if (e.key === "ArrowDown" && dy === 0) { dx = 0; dy = 1; }
  if (e.key === "ArrowLeft" && dx === 0) { dx = -1; dy = 0; }
  if (e.key === "ArrowRight" && dx === 0) { dx = 1; dy = 0; }
});

function updateHighScore() {
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("highScore", highScore);
  }
}

function drawScore() {
  ctx.fillStyle = currentTheme === "dark" ? "#eee" : "#222";
  ctx.font = "14px monospace";
  ctx.fillText("Score: " + score, 10, 390);
  ctx.fillText("High Score: " + highScore, 250, 390);
}

function drawColorfulSnake() {
  snake.forEach((part, i) => {
    let brightness = currentTheme === "dark" ? 100 - i * 3 : 65 - i * 2;
    let colorHue = (hue + i * 10) % 360;
    ctx.fillStyle = `hsl(${colorHue}, 100%, ${brightness}%)`;
    ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize - 2, gridSize - 2);
  });
  hue = (hue + 2) % 360;
}

function drawGlowingFood() {
  foodPulse = (foodPulse + 1) % 60;
  const glow = 60 + Math.sin(foodPulse / 10) * 30;
  ctx.fillStyle = `hsl(60, 100%, ${glow}%)`;
  ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);
}

function moveAI() {
  let head = snake[0];
  if (food.x < head.x && dx !== 1) { dx = -1; dy = 0; }
  else if (food.x > head.x && dx !== -1) { dx = 1; dy = 0; }
  else if (food.y < head.y && dy !== 1) { dx = 0; dy = -1; }
  else if (food.y > head.y && dy !== -1) { dx = 0; dy = 1; }
}

function gameLoop() {
  if (!canvas.style.display || canvas.style.display === "none") return;
  if (paused) {
    ctx.fillStyle = "orange";
    ctx.font = "28px monospace";
    ctx.fillText("Paused", 150, 200);
    return;
  }

  if (autoPlay) moveAI();

  if (gameOver) {
    updateHighScore();
    ctx.fillStyle = "crimson";
    ctx.font = "30px monospace";
    ctx.fillText("Game Over", 120, 200);
    restartBtn.style.display = "inline-block";
    return;
  }

  const head = { x: snake[0].x + dx, y: snake[0].y + dy };

  if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount || snake.some(p => p.x === head.x && p.y === head.y)) {
    gameOver = true;
    bgMusic.pause();
    gameOverSound.play();
    return;
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score++;
    eatSound.play();
    food = {
      x: Math.floor(Math.random() * tileCount),
      y: Math.floor(Math.random() * tileCount)
    };
  } else {
    snake.pop();
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGlowingFood();
  drawColorfulSnake();
  drawScore();
}

setInterval(gameLoop, 120);
