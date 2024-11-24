const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.height = window.innerHeight;
canvas.width = canvas.height * (4 / 3);

// Center the canvas
canvas.style.position = "absolute";
canvas.style.left = `${(window.innerWidth - canvas.width) / 2}px`;

// Game states
let state = "start"; // Possible states: "start", "playing", "gameOver"

// Player setup
const chef = { x: canvas.width / 2, y: canvas.height - 100, width: 50, height: 50, speed: 7, dx: 0 };

// Game variables
let customers = [];
let projectiles = [];
let score = 0;
let disappointedCount = 0;
const maxDisappointed = 25;

// Blinking Start Text
let blinkVisible = true;
let blinkTimer = 0;

// Customer and Projectile Configuration
const randomEmojis = ["👩‍🍳", "👨‍🎤", "👨‍🌾", "👩‍🔬"];
const largeEmoji = "👩‍⚖️";
const explosionEmoji = "💥";
const sadEmoji = "😢";
const counterY = canvas.height - 150;

// Utility Functions
function randomX() {
  return Math.random() * (canvas.width - 50);
}

function drawText(text, x, y, size, color = "white") {
  ctx.font = `${size}px 'Press Start 2P', cursive`;
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.fillText(text, x, y);
}

function drawFrame() {
  ctx.strokeStyle = "gold";
  ctx.lineWidth = 15;
  ctx.strokeRect(0, 0, canvas.width, canvas.height);
}

function clearScreen() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Draw Emoji
function drawEmoji(emoji, x, y, size) {
  ctx.font = `${size}px Arial`;
  ctx.fillText(emoji, x, y + size);
}

// Move the Chef
function moveChef() {
  chef.x += chef.dx; // Update chef's position based on direction
  if (chef.x < 0) chef.x = 0; // Prevent moving off the left edge
  if (chef.x + chef.width > canvas.width) chef.x = canvas.width - chef.width; // Prevent moving off the right edge
}

// Create Customers
function createCustomer() {
  const size = Math.random() > 0.8 ? 100 : 50; // Large customer 20% of the time
  customers.push({
    x: randomX(), // Random X position
    y: -size, // Start above the screen
    size: size, // Customer size
    health: size === 100 ? 5 : 1, // Large customers take 5 hits
    emoji: size === 100 ? largeEmoji : randomEmojis[Math.floor(Math.random() * randomEmojis.length)], // Random emoji
    timer: 0, // Timer for how long the customer waits at the counter
    served: false, // Whether the customer has been served
    leaving: false, // Whether the customer is leaving
    exploding: false, // Whether the customer is exploding
    explosionTimer: 0, // Timer for explosion animation
    explosionSize: size, // Initial explosion size
  });
}

// **Start Screen Logic**
function startScreen() {
  clearScreen();
  drawText("CHEF INVADERS", canvas.width / 2, canvas.height / 3, 30, "cyan");

  if (blinkVisible) {
    drawText("[ Press Any Key to Begin ]", canvas.width / 2, canvas.height / 2, 20, "white");
  }
  drawFrame();

  // Blinking effect
  blinkTimer++;
  if (blinkTimer % 30 === 0) blinkVisible = !blinkVisible;

  if (state === "start") {
    requestAnimationFrame(startScreen);
  }
}

// **Gameplay Logic**
function update() {
  clearScreen();
  drawText(`Score: ${score}`, canvas.width / 3, 50, 20, "white");
  drawText(`Disappointed: ${disappointedCount}`, (2 * canvas.width) / 3, 50, 20, "white");

  // Draw Chef
  moveChef();
  drawEmoji("🍳", chef.x, chef.y, chef.width);

  // Move and draw projectiles
  projectiles = projectiles.filter((p) => p.y > 0); // Remove off-screen projectiles
  projectiles.forEach((p) => {
    p.y -= 10; // Move up
    drawEmoji("🍔", p.x, p.y, p.size);
  });

  // Spawn and move customers
  if (Math.random() < 0.02) createCustomer();
  customers.forEach((customer) => {
    if (customer.exploding) {
      // Handle explosions
      customer.explosionSize += 5; // Explosion grows
      customer.explosionTimer++;
      drawEmoji(explosionEmoji, customer.x, customer.y, customer.explosionSize);

      if (customer.explosionTimer > 20) {
        customers = customers.filter((c) => c !== customer); // Remove after explosion
      }
      return;
    }

    if (customer.leaving) {
      // Handle leaving customers
      customer.y -= 2;
      drawEmoji(customer.emoji, customer.x, customer.y, customer.size);
      if (customer.y < 0) {
        customers = customers.filter((c) => c !== customer); // Remove off-screen
      }
      return;
    }

    if (!customer.served && customer.y + customer.size >= counterY) {
      // Customer reaches the counter
      customer.y = counterY; // Lock to counter
      customer.timer++;

      if (customer.timer > 200) {
        customer.emoji = sadEmoji; // Turn sad
        customer.leaving = true; // Start leaving
        disappointedCount++; // Increment disappointed count
      }
    } else {
      // Move customer
      customer.y += 2;
    }

    drawEmoji(customer.emoji, customer.x, customer.y, customer.size);
  });

  // Handle collisions (projectiles vs customers)
  projectiles.forEach((p, i) => {
    customers.forEach((c, j) => {
      if (
        !c.leaving &&
        p.y < c.y + c.size &&
        p.x + p.size > c.x &&
        p.x < c.x + c.size
      ) {
        c.health--;
        projectiles.splice(i, 1); // Remove projectile
        if (c.health <= 0) {
          c.exploding = true;
          score += c.size === 100 ? 3 : 1; // Add points (3 for large, 1 for small)
        }
      }
    });
  });

  // End game if too many disappointed customers
  if (disappointedCount >= maxDisappointed) {
    state = "gameOver";
    return;
  }

  drawFrame();
  if (state === "playing") requestAnimationFrame(update);
}

// **Game Over Screen**
function gameOverScreen() {
  clearScreen();
  drawText("GAME OVER", canvas.width / 2, canvas.height / 2, 30, "red");
  drawText("Too many disappointed customers!", canvas.width / 2, canvas.height / 2 + 50, 20, "white");
  drawFrame();
}

// **State Transition Logic**
window.addEventListener("keydown", (e) => {
  if (state === "start") {
    state = "playing";
    update(); // Start gameplay
  } else if (state === "playing") {
    if (e.key === "ArrowLeft") chef.dx = -chef.speed;
    if (e.key === "ArrowRight") chef.dx = chef.speed;
    if (e.key === " " && projectiles.length < 5) {
      projectiles.push({ x: chef.x + chef.width / 2 - 10, y: chef.y, size: 20 });
    }
  }
});

window.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft" || e.key === "ArrowRight") chef.dx = 0;
});

// Start the game
startScreen();