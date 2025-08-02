

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
const skinSelect = document.getElementById("skinSelect");
const touchControls = document.getElementById("touch-controls");
const scoreList = document.getElementById("scoreList");
const gameContainer = document.getElementById("game-container");
const clearScoresBtn = document.getElementById("clearScoresBtn");

const gridSize = 20;
const tileCount = canvas.width / gridSize;

let snake, food, dx, dy, score, gameOver, autoPlay, paused, speed;
let direction = "right";
let highScores = JSON.parse(localStorage.getItem("highScores") || "[]");
let currentTheme = "light";
let currentSkin = "classic";
let gameInterval;
let foodPulse = 0;
let hue = 0;
let powerUps = [];
let doublePoints = false;

function initGame() {
  snake = [{ x: 10, y: 10 }];
  food = { x: 5, y: 5 };
  powerUps = [];
  dx = 1; dy = 0; direction = "right";
  score = 0; gameOver = false; paused = false;
  doublePoints = false; speed = 200;

  clearInterval(gameInterval);
  gameInterval = setInterval(gameLoop, speed);

  canvas.style.display = "block";
  gameContainer.style.display = "flex";
  restartBtn.style.display = "none";
  menu.style.display = "none";
  touchControls.style.display = "block";
  updateLeaderboard();
  if (!bgMusic.paused) bgMusic.play();
}

function updateSpeed() {
  if (speed > 50) speed -= 10;
  clearInterval(gameInterval);
  gameInterval = setInterval(gameLoop, speed);
}

function spawnFood() {
  food = {
    x: Math.floor(Math.random() * tileCount),
    y: Math.floor(Math.random() * tileCount)
  };
}

function spawnPowerUp() {
  const types = ["speed", "slow", "double"];
  const type = types[Math.floor(Math.random() * types.length)];
  powerUps.push({
    x: Math.floor(Math.random() * tileCount),
    y: Math.floor(Math.random() * tileCount),
    type,
    duration: 300
  });
}

function drawSnake() {
  snake.forEach((part, i) => {
    const x = part.x * gridSize;
    const y = part.y * gridSize;

    if (i === 0) {
      ctx.fillStyle = "limegreen";
      ctx.fillRect(x, y, gridSize - 2, gridSize - 2);
      ctx.fillStyle = "black";
      const eyeSize = 3;
      if (dx === 1) { ctx.fillRect(x + gridSize - 8, y + 4, eyeSize, eyeSize); ctx.fillRect(x + gridSize - 8, y + gridSize - 8, eyeSize, eyeSize); }
      if (dx === -1) { ctx.fillRect(x + 4, y + 4, eyeSize, eyeSize); ctx.fillRect(x + 4, y + gridSize - 8, eyeSize, eyeSize); }
      if (dy === -1) { ctx.fillRect(x + 4, y + 4, eyeSize, eyeSize); ctx.fillRect(x + gridSize - 8, y + 4, eyeSize, eyeSize); }
      if (dy === 1) { ctx.fillRect(x + 4, y + gridSize - 8, eyeSize, eyeSize); ctx.fillRect(x + gridSize - 8, y + gridSize - 8, eyeSize, eyeSize); }
    } else {
      const brightness = 70 - i * 2;
      let color = "green";
      if (currentSkin === "neon") color = `hsl(${(hue + i * 10) % 360}, 100%, 50%)`;
      else if (currentSkin === "dark") color = `hsl(200, 20%, ${brightness}%)`;
      else if (currentSkin === "rainbow") color = `hsl(${(hue + i * 20) % 360}, 100%, 50%)`;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, gridSize - 2, gridSize - 2);
    }
  });
  hue = (hue + 2) % 360;
}

function drawFood() {
  foodPulse = (foodPulse + 1) % 60;
  const glow = 60 + Math.sin(foodPulse / 10) * 30;
  ctx.fillStyle = currentSkin === "neon" ? `hsl(60, 100%, ${glow}%)` : "gold";
  ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);
}

function drawPowerUps() {
  powerUps.forEach(p => {
    let color = p.type === "speed" ? "blue" : p.type === "slow" ? "purple" : "red";
    ctx.fillStyle = color;
    ctx.fillRect(p.x * gridSize, p.y * gridSize, gridSize, gridSize);
  });
}

function drawScore() {
  ctx.fillStyle = currentTheme === "dark" ? "#eee" : "#222";
  ctx.font = "14px monospace";
  ctx.fillText("Score: " + score, 10, 390);
}

function updateLeaderboard() {
  scoreList.innerHTML = "";
  highScores.sort((a, b) => b - a).slice(0, 5).forEach((s, i) => {
    const li = document.createElement("li");
    li.textContent = `${i + 1}. ${s}`;
    scoreList.appendChild(li);
  });
  document.getElementById("leaderboard").style.display = "block";
}

function gameLoop() {
  if (paused || gameOver) return;
  if (autoPlay) moveAI();
  const head = { x: snake[0].x + dx, y: snake[0].y + dy };

  if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount || snake.some(p => p.x === head.x && p.y === head.y)) {
    gameOver = true;
    gameOverSound.play();
    bgMusic.pause();
    highScores.push(score);
    localStorage.setItem("highScores", JSON.stringify(highScores));
    updateLeaderboard();
    restartBtn.style.display = "inline-block";
    return;
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score += doublePoints ? 2 : 1;
    eatSound.play();
    spawnFood();
    if (Math.random() < 0.3) spawnPowerUp();
    updateSpeed();
  } else {
    snake.pop();
  }

  powerUps.forEach((p, i) => {
    if (p.x === head.x && p.y === head.y) {
      if (p.type === "speed") speed = Math.max(speed - 50, 50);
      if (p.type === "slow") speed += 50;
      if (p.type === "double") doublePoints = true;
      powerUps.splice(i, 1);
      updateSpeed();
      setTimeout(() => doublePoints = false, 5000);
    }
  });

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawFood();
  drawPowerUps();
  drawSnake();
  drawScore();
}

function changeDirection(dir) {
  if (dir === "up" && dy === 0) { dx = 0; dy = -1; direction = "up"; }
  if (dir === "down" && dy === 0) { dx = 0; dy = 1; direction = "down"; }
  if (dir === "left" && dx === 0) { dx = -1; dy = 0; direction = "left"; }
  if (dir === "right" && dx === 0) { dx = 1; dy = 0; direction = "right"; }
}

document.addEventListener("keydown", e => {
  if (e.key === "p") paused = !paused;
  if (e.key.startsWith("Arrow")) changeDirection(e.key.replace("Arrow", "").toLowerCase());
});

let startX, startY;
canvas.addEventListener("touchstart", e => {
  startX = e.touches[0].clientX;
  startY = e.touches[0].clientY;
});
canvas.addEventListener("touchend", e => {
  let dxSwipe = e.changedTouches[0].clientX - startX;
  let dySwipe = e.changedTouches[0].clientY - startY;
  if (Math.abs(dxSwipe) > Math.abs(dySwipe)) changeDirection(dxSwipe > 0 ? "right" : "left");
  else changeDirection(dySwipe > 0 ? "down" : "up");
});

startBtn.addEventListener("click", initGame);
restartBtn.addEventListener("click", initGame);
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
skinSelect.addEventListener("change", e => {
  currentSkin = e.target.value;
});

clearScoresBtn.addEventListener("click", () => {
  if (confirm("Are you sure you want to clear the leaderboard?")) {
    localStorage.removeItem("highScores");
    highScores = [];
    updateLeaderboard();
  }
});

function moveAI() {
  const head = snake[0];
  if (food.x < head.x && dx !== 1) changeDirection("left");
  else if (food.x > head.x && dx !== -1) changeDirection("right");
  else if (food.y < head.y && dy !== 1) changeDirection("up");
  else if (food.y > head.y && dy !== -1) changeDirection("down");
}
