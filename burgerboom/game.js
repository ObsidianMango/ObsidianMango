const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Adjust canvas size dynamically for iPhone screen ratio (9:16)
function resizeCanvas() {
  canvas.width = Math.min(375, window.innerWidth); // iPhone screen width (max 375px)
  canvas.height = canvas.width * (16 / 9); // Maintain 9:16 aspect ratio
  canvas.style.position = "absolute";
  canvas.style.left = `${(window.innerWidth - canvas.width) / 2}px`;
  canvas.style.top = `${(window.innerHeight - canvas.height) / 2}px`;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// Game states
let state = "start"; // Possible states: "start", "playing", "gameOver"

// Player setup
const chef = { x: canvas.width / 2, y: canvas.height - 100, width: 50, height: 50, speed: 300, dx: 0 };

// Touch controls
let touchStartX = null;
let isTouching = false;

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

// Speed constants
const CUSTOMER_SPEED = 50; // pixels per second
const PROJECTILE_SPEED = 300; // pixels per second

let lastTimestamp = 0; // Tracks the last frame's timestamp

// Utility Functions
function clearScreen() {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#222"); // Dark gray
  gradient.addColorStop(1, "#7c7c7c"); // Black
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw counter area
  ctx.fillStyle = "#444"; // Darker gray for the counter
  ctx.fillRect(0, canvas.height - counterHeight, canvas.width, counterHeight);
}

function drawText(text, x, y, size, color = "white", align = "center") {
  ctx.font = `${size}px 'Press Start 2P', cursive`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
}

function drawStars() {
  const starSize = 30;
  const totalWidth = stars * (starSize + 10) - 10; // Total width of stars
  const startX = (canvas.width - totalWidth) / 2 + 15; // Centered starting x position, shifted right by 10 pixels
  const starY = canvas.height - 20; // Adjust to fit at the bottom

  for (let i = 0; i < stars; i++) {
    drawEmoji("⭐", startX + i * (starSize + 10), starY, starSize);
  }
}

function drawEmoji(emoji, x, y, size) {
  ctx.font = `${size}px Arial`;
  ctx.fillText(emoji, x, y + size / 2); // Center emoji vertically
}

// Reset Game Logic
function resetGame() {
  customers = [];
  projectiles = [];
  score = 0;
  disappointedCount = 0;
  stars = 5; // Reset stars
  state = "playing";
  lastTimestamp = 0; // Reset timestamp
  update(performance.now()); // Start game loop
}

// Start Screen
function startScreen() {
  clearScreen();

  const titleFontSize = Math.min(30, canvas.width / 15);
  const instructionFontSize = Math.min(20, canvas.width / 25);

  const padding = 10;

  drawText("BURGER BOOM", canvas.width / 2, canvas.height / 3, titleFontSize, "cyan");
  drawText("Press Anything", canvas.width / 2, canvas.height / 2 - instructionFontSize, instructionFontSize, "white");
  drawText("to Start", canvas.width / 2, canvas.height / 2 + instructionFontSize + padding, instructionFontSize, "white");

  // Add event listeners for starting the game
  document.addEventListener("keydown", handleGameStart, { once: true });
  canvas.addEventListener("click", handleGameStart, { once: true });
  canvas.addEventListener("touchstart", handleGameStart, { once: true });

  if (state === "start") {
    requestAnimationFrame(startScreen);
  }
}
//gameover screen
function gameOverScreen() {
  clearScreen();

  const titleFontSize = Math.min(30, canvas.width / 15);
  const instructionFontSize = Math.min(20, canvas.width / 25);

  const padding = 10;

  drawText("GAME OVER", canvas.width / 2, canvas.height / 3, titleFontSize, "red");
  drawText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 3 + titleFontSize + 10, instructionFontSize, "white");
  drawText("Press Anything", canvas.width / 2, canvas.height / 2 - instructionFontSize, instructionFontSize, "white");
  drawText("to Restart", canvas.width / 2, canvas.height / 2 + instructionFontSize + padding, instructionFontSize, "white");

  // Add event listeners for restarting the game
  document.addEventListener("keydown", handleGameRestart, { once: true });
  canvas.addEventListener("click", handleGameRestart, { once: true });
  canvas.addEventListener("touchstart", handleGameRestart, { once: true });
}


function handleGameStart() {
  state = "playing"; // Set state to playing
  update(performance.now()); // Start the game loop
}

function handleGameRestart() {
  state = "start"; // Set state to start
  resetGame(); // Restart the game
}

// Spawn Customer
function createCustomer() {
  const size = Math.random() > 0.9 ? 80 : 50; // Adjust size for better visibility
  customers.push({
    x: Math.random() * (canvas.width - size),
    y: -size, // Start above the screen
    size,
    health: size === 80 ? 5 : 1,
   emoji: size === 80 
    ? ["🧔‍♂️", "🐄"][Math.floor(Math.random() * 2)]
    : ["👮‍♂️", "👷‍♀️", "👨", "👩", "👷‍♂️"][Math.floor(Math.random() * 5)],
    timer: 0, // Timer for how long they've been at the counter
    leaving: false,
    exploding: false,
  });
}

// Handle Customer Explosion and Leaving
function handleCustomerLeaveOrExplode(customer) {
  if (customer.exploding) {
    if (customer.size === 80) {
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

// Game Update Logic
function update(timestamp) {
  const deltaTime = (timestamp - lastTimestamp) / 1000; // Convert time difference to seconds
  lastTimestamp = timestamp;

  clearScreen();
  drawStars();

  // Draw the score just above the stars
  const scoreYPosition = canvas.height - counterHeight + 110; // Adjust position to fit above the stars
  drawText(`Score: ${score}`, canvas.width / 2, scoreYPosition, 20, "white");

  // Handle keyboard movement
  chef.dx = 0;
  if (keys["ArrowLeft"]) chef.dx = -chef.speed;
  if (keys["ArrowRight"]) chef.dx = chef.speed;

  chef.x += chef.dx * deltaTime;
  if (chef.x < 0) chef.x = 0;
  if (chef.x + chef.width > canvas.width) chef.x = canvas.width - chef.width;
  drawEmoji("🍳", chef.x, chef.y, chef.width);

  // Move projectiles
  projectiles.forEach((p) => (p.y -= PROJECTILE_SPEED * deltaTime));
  projectiles = projectiles.filter((p) => p.y > 0);
  projectiles.forEach((p) => drawEmoji("🍔", p.x, p.y, 40)); // Adjust projectile size

  // Move customers
  customers.forEach((c) => {
    if (!c.leaving && !c.exploding) {
      if (c.y + c.size >= canvas.height - counterHeight) {
        // Customer has reached the counter
        c.timer += deltaTime; // Increment wait timer
        if (c.timer > 2) {
          c.leaving = true; // Transform into sad face after 2 seconds
          disappointedCount++;
          if (disappointedCount % maxDisappointedBeforeStarLoss === 0) {
            stars--;
          }
        }
      } else {
        c.y += CUSTOMER_SPEED * deltaTime; // Continue moving down
      }
    }
  });

  // Draw all customers
  customers.forEach((c) => drawEmoji(c.emoji, c.x, c.y, c.size));

  // Handle logic for leaving or exploding customers
  customers.forEach(handleCustomerLeaveOrExplode);

  // Handle collisions
  handleCollisions();

  // Check for game over
  if (stars <= 0) {
    state = "gameOver";
    gameOverScreen();
    return;
  }

  // Add new customers
  if (Math.random() < 0.02) createCustomer();

  if (state === "playing") requestAnimationFrame(update);
}

// Touch Events
canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();
  isTouching = true;
  touchStartX = e.touches[0].clientX;

  // Shoot if quick tap
  if (projectiles.length < 5) {
    projectiles.push({ x: chef.x + chef.width / 2 - 10, y: chef.y, size: 20 });
  }
});

canvas.addEventListener("touchmove", (e) => {
  e.preventDefault();
  if (isTouching) {
    const touchX = e.touches[0].clientX;
    chef.x += touchX - touchStartX; // Move chef based on finger slide
    touchStartX = touchX;
  }
});

canvas.addEventListener("touchend", () => {
  isTouching = false;
  chef.dx = 0;
});

// Keyboard Events
document.addEventListener("keydown", (e) => {
  keys[e.key] = true;
  if (state === "start") {
    state = "playing";
    update(performance.now());
  } else if (state === "playing" && e.key === " " && projectiles.length < 5) {
    projectiles.push({ x: chef.x + chef.width / 2 - 10, y: chef.y, size: 20 });
  }
});

document.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

// Start the game
startScreen();
