const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Adjust canvas size dynamically
function resizeCanvas() {
  canvas.width = Math.min(600, window.innerWidth); // Max width 600px
  canvas.height = canvas.width * (4 / 3); // Maintain 4:3 aspect ratio
  canvas.style.position = "absolute";
  canvas.style.left = `${(window.innerWidth - canvas.width) / 2}px`;
  canvas.style.top = `${(window.innerHeight - canvas.height) / 2}px`;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// Game states
let state = "start"; // Possible states: "start", "playing", "gameOver"

// Player setup
const chef = { x: canvas.width / 2, y: canvas.height - 100, width: 50, height: 50, speed: 7, dx: 0 };

// Touch controls
let touchStartX = null;

// Keyboard controls
const keys = {};

// Game variables
let customers = [];
let projectiles = [];
let score = 0;
let disappointedCount = 0;
let stars = 5; // Start with 5 stars
const maxDisappointedBeforeStarLoss = 5;

// Counter height
const counterHeight = 150;

// Utility Functions
function clearScreen() {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#222"); // Dark gray
  gradient.addColorStop(1, "#000"); // Black
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw counter area
  ctx.fillStyle = "#444"; // Darker gray for the counter
  ctx.fillRect(0, canvas.height - counterHeight, canvas.width, counterHeight);
}

function drawText(text, x, y, size, color = "white") {
  ctx.font = `${size}px 'Press Start 2P', cursive`;
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.fillText(text, x, y);
}

function drawStars() {
  const starSize = 30;
  const starY = 20;
  for (let i = 0; i < stars; i++) {
    drawEmoji("⭐", 30 + i * (starSize + 10), starY, starSize);
  }
}

function drawEmoji(emoji, x, y, size) {
  ctx.font = `${size}px Arial`;
  ctx.fillText(emoji, x, y + size);
}

// Reset Game Logic
function resetGame() {
  customers = [];
  projectiles = [];
  score = 0;
  disappointedCount = 0;
  stars = 5; // Reset stars
  state = "playing";
  update();
}

// Start Screen
function startScreen() {
  clearScreen();

  const titleFontSize = Math.min(30, canvas.width / 15);
  const instructionFontSize = Math.min(20, canvas.width / 25);

  const padding = 10;

  drawText("CHEF INVADERS", canvas.width / 2, canvas.height / 3, titleFontSize, "cyan");
  drawText("Tap or Press Any Key", canvas.width / 2, canvas.height / 2 - instructionFontSize, instructionFontSize, "white");
  drawText("to Start", canvas.width / 2, canvas.height / 2 + instructionFontSize + padding, instructionFontSize, "white");

  if (state === "start") {
    requestAnimationFrame(startScreen);
  }
}

function gameOverScreen() {
  clearScreen();

  const titleFontSize = Math.min(30, canvas.width / 15);
  const instructionFontSize = Math.min(20, canvas.width / 25);

  const padding = 10;

  drawText("GAME OVER", canvas.width / 2, canvas.height / 3, titleFontSize, "red");
  drawText("Tap or Press Any Key", canvas.width / 2, canvas.height / 2 - instructionFontSize, instructionFontSize, "white");
  drawText("to Restart", canvas.width / 2, canvas.height / 2 + instructionFontSize + padding, instructionFontSize, "white");

  document.addEventListener("keydown", handleRestart, { once: true });
  canvas.addEventListener("click", handleRestart, { once: true });
}

function handleRestart() {
  state = "start"; // Reset state
  resetGame();
}

// Spawn Customer
function createCustomer() {
  const size = Math.random() > 0.8 ? 100 : 50;
  customers.push({
    x: Math.random() * (canvas.width - size),
    y: -size,
    size,
    health: size === 100 ? 5 : 1,
    emoji: size === 100 ? "👩‍⚖️" : "👨‍🍳",
    leaving: false,
    exploding: false,
    timer: 0,
  });
}

// Handle Customer Explosion and Leaving
function handleCustomerLeaveOrExplode(customer) {
  if (customer.exploding) {
    if (customer.size === 100) {
      score += 20; // Add 20 points for larger customers
    } else {
      score += 5; // Add 5 points for regular customers
    }
    drawEmoji("💥", customer.x, customer.y, customer.size + 20);
    customers.splice(customers.indexOf(customer), 1);
  } else if (customer.leaving) {
    customer.y -= 2;
    if (customer.emoji !== "😢") {
      customer.emoji = "😢"; // Turn customer into a sad face
    }
    if (customer.y < 0) {
      customers.splice(customers.indexOf(customer), 1); // Remove customer when off-screen
    }
  }
}

// Handle Collisions
function handleCollisions() {
  projectiles.forEach((p, pi) => {
    customers.forEach((c, ci) => {
      if (
        !c.leaving &&
        p.y < c.y + c.size &&
        p.x + p.size > c.x &&
        p.x < c.x + c.size
      ) {
        c.health--;
        projectiles.splice(pi, 1);
        if (c.health <= 0) {
          c.exploding = true;
        }
      }
    });
  });
}

function update() {
  clearScreen();
  drawStars();

  // Ensure the score is fully visible and aligned to the right
  ctx.textAlign = "right";
  drawText(`Score: ${score}`, canvas.width - 100, 50, 20, "white"); // Align to right and leave 10px padding

  if (keys["ArrowLeft"]) chef.dx = -chef.speed;
  if (keys["ArrowRight"]) chef.dx = chef.speed;
  if (!keys["ArrowLeft"] && !keys["ArrowRight"]) chef.dx = 0;

  chef.x += chef.dx;
  if (chef.x < 0) chef.x = 0;
  if (chef.x + chef.width > canvas.width) chef.x = canvas.width - chef.width;
  drawEmoji("🍳", chef.x, chef.y, chef.width);

  projectiles = projectiles.filter((p) => p.y > 0);
  projectiles.forEach((p) => {
    p.y -= 10;
    drawEmoji("🍔", p.x, p.y, p.size);
  });

  if (Math.random() < 0.02) createCustomer();
  customers.forEach((customer) => {
    if (customer.exploding || customer.leaving) {
      handleCustomerLeaveOrExplode(customer);
    } else if (!customer.served && customer.y + customer.size >= canvas.height - counterHeight) {
      customer.y = canvas.height - counterHeight - customer.size;
      customer.timer++;

      if (customer.timer > 200) {
        customer.leaving = true;
        disappointedCount++;
        if (disappointedCount % maxDisappointedBeforeStarLoss === 0) {
          stars--;
        }
      }
    } else {
      customer.y += 2;
    }
    drawEmoji(customer.emoji, customer.x, customer.y, customer.size);
  });

  handleCollisions();

  if (stars <= 0) {
    state = "gameOver";
    gameOverScreen();
    return;
  }

  if (state === "playing") requestAnimationFrame(update);
}

// Touch Events
canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();
  if (state === "start") {
    state = "playing";
    update();
  } else if (state === "playing") {
    touchStartX = e.touches[0].clientX;
  }
});

canvas.addEventListener("touchmove", (e) => {
  e.preventDefault();
  if (state === "playing") {
    const touchX = e.touches[0].clientX;
    chef.x += touchX - touchStartX; // Move chef based on finger slide
    touchStartX = touchX;
  }
});

canvas.addEventListener("touchend", () => {
  chef.dx = 0;
});

// Keyboard Events
document.addEventListener("keydown", (e) => {
  keys[e.key] = true;
  if (state === "start") {
    state = "playing";
    update();
  } else if (state === "playing" && e.key === " " && projectiles.length < 5) {
    projectiles.push({ x: chef.x + chef.width / 2 - 10, y: chef.y, size: 20 });
  }
});

document.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

// Start the game
startScreen();
