const root = 'https://obsidianmango.github.io/ObsidianMango/';
const game = (id, title, genre, path, icon, color, dark, x, z, turn) => ({
  id, title, genre, url: new URL(path, root).href,
  icon: icon.startsWith('data:') ? icon : new URL(icon, root).href,
  color, dark, x, z, turn
});

const emberIcon = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='10' fill='%23251932'/%3E%3Cpath fill='%23e1a74c' d='M8 46h48v7H8z'/%3E%3Cpath fill='%23a694fc' d='m12 46 12-16 6-19 19 2-12 8 12 25z'/%3E%3Ccircle cx='31' cy='32' r='4' fill='%23ffe4a0'/%3E%3C/svg%3E";
const lifeIcon = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='12' fill='%23090e0e'/%3E%3Cpath d='M32 8 55 21v22L32 56 9 43V21Z' fill='none' stroke='%2385e9b5' stroke-width='3'/%3E%3Cpath d='M32 19v26M19 32h26' stroke='%2385e9b5' stroke-width='4'/%3E%3C/svg%3E";

export const stations = [
  game('ember', 'Ember & Acorn', 'Pixel adventure', 'ember-and-acorn/?v=543591ff5ee1', emberIcon, '#ff9f58', '#542634', -6.5, 5.2, Math.PI/2),
  game('nutwood', 'Nutwood Grove', 'Woodland sandbox', 'nutwood-grove/', 'nutwood-grove/favicon-32.png?v=2', '#b5db77', '#344733', -6.5, 1.55, Math.PI/2),
  game('gnat', 'Gnatfall', 'Pest-control action', 'gnatfall/', 'gnatfall/icon.svg', '#f68151', '#482232', -6.5, -2.1, Math.PI/2),
  game('castle', 'Castle Smasher', 'Siege physics', 'castle-smasher/', 'castle-smasher/icon.svg', '#ffc96e', '#5b3b35', -6.5, -5.75, Math.PI/2),
  game('gold', 'Goldwreck', 'Drone combat', 'goldwreck/?v=3', 'goldwreck/icon.png?v=4', '#ffd685', '#5b4b42', -2.45, -11.25, 0),
  game('life', 'Life Forge', 'Magic life counter', 'life-forge.html', lifeIcon, '#83edc0', '#22453d', 0.45, -11.25, 0),
  game('dia', 'DIA II', 'Wave playground', 'dia2.html?utm_source=chatgpt.com', 'dia2-icon.svg', '#75d9f3', '#2d3a66', 6.5, -5.75, -Math.PI/2),
  game('frog', 'Frog Nom 3', 'Pond adventure', 'frog-nom-3/', 'frog-nom-3/icon.svg?v=1', '#8ded78', '#2c4a36', 6.5, -2.1, -Math.PI/2),
  game('bag', 'Bag Shift ’06', 'Bagging puzzle', 'https://obsidianmango.github.io/bag-shift-06/', 'https://obsidianmango.github.io/bag-shift-06/icons/icon-192.png', '#89ccff', '#304c67', 6.5, 1.55, -Math.PI/2),
  game('food', 'Foodtris', 'Food stacking', 'foodtris/play.html', 'foodtris/icon.svg', '#ff85ae', '#5b2e54', 6.5, 5.2, -Math.PI/2),
  game('vending', 'Booster Vending', 'Magic: The Gathering', 'mtgboost.html', 'mtgboost-icon.svg', '#e399f6', '#4e2d63', 5.1, -11, 0)
];

export const room = { minX: -8.85, maxX: 8.85, minZ: -12.65, maxZ: 10.3 };
export const spawn = { x: 0, z: 8.3, yaw: 0, pitch: -0.018 };
