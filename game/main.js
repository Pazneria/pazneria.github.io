import { tileSize, mapWidth, mapHeight, backgroundColor } from './config.js';
import World from './world.js';
import Player from './player.js';

// Initialise the game once the DOM is ready. Creates a canvas
// sized to the world, instantiates the world and player, and
// starts the animation loop.
function createGame() {
  const container = document.getElementById('game-container');
  // Clear any existing content (useful during hot reloads)
  container.innerHTML = '';

  const canvas = document.createElement('canvas');
  canvas.width = mapWidth * tileSize;
  canvas.height = mapHeight * tileSize;
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d');

  const world = new World();
  const saved = JSON.parse(localStorage.getItem('pazneriaGameState') || '{}');
  const spawnX = saved.x !== undefined ? saved.x : Math.floor(mapWidth / 2);
  const spawnY = saved.y !== undefined ? saved.y : Math.floor(mapHeight / 2);
  const player = new Player(world, spawnX, spawnY);

  // Handle click/tap input to move the player
  canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const pixelX = event.clientX - rect.left;
    const pixelY = event.clientY - rect.top;
    const { x, y } = world.getTileCoordinates(pixelX, pixelY);
    if (world.isWalkable(x, y)) {
      player.moveTo(x, y);
    }
  });

  function gameLoop() {
    // Clear the canvas with the background colour
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw world and player
    world.draw(ctx);
    player.update();
    player.draw(ctx);

    requestAnimationFrame(gameLoop);
  }

  gameLoop();
}

window.addEventListener('DOMContentLoaded', createGame);
