import { tileSize, mapWidth, mapHeight, backgroundColor, tickDuration } from './config.js';
import World from './world/world.js';
import Player from './entities/player.js';

let world;
let player;
let canvas;
let ctx;

function createGame() {
  const container = document.getElementById('game-container');
  container.innerHTML = '';
  canvas = document.createElement('canvas');
  canvas.width = mapWidth * tileSize;
  canvas.height = mapHeight * tileSize;
  container.appendChild(canvas);
  ctx = canvas.getContext('2d');

  world = new World();
  const saved = JSON.parse(localStorage.getItem('pazneriaGameState')) || {};
  let spawnX = saved.x !== undefined ? saved.x : Math.floor(world.width / 2);
  let spawnY = saved.y !== undefined ? saved.y : Math.floor(world.height / 2);
  // Ensure the spawn tile is always empty so the player doesn't start
  // on top of a resource node.
  if (world.isWithinBounds(spawnX, spawnY)) {
    world.tiles[spawnY][spawnX].type = 'empty';
  }
  player = new Player(world, spawnX, spawnY);

  canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const pixelX = (event.clientX - rect.left) * scaleX;
    const pixelY = (event.clientY - rect.top) * scaleY;
    const { camX, camY } = getCamera();
    const { x, y } = world.getTileCoordinates(pixelX, pixelY, camX, camY);
    player.moveTo(x, y);
  });

  setInterval(() => {
    player.update();
    world.tick();
  }, tickDuration);

  requestAnimationFrame(gameLoop);
}

function getCamera() {
  const halfW = Math.floor(mapWidth / 2);
  const halfH = Math.floor(mapHeight / 2);
  const camX = Math.max(0, Math.min(player.x - halfW, world.width - mapWidth));
  const camY = Math.max(0, Math.min(player.y - halfH, world.height - mapHeight));
  return { camX, camY };
}

function gameLoop() {
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const { camX, camY } = getCamera();
  world.draw(ctx, camX, camY);
  player.draw(ctx, camX, camY);
  requestAnimationFrame(gameLoop);
}

window.addEventListener('DOMContentLoaded', createGame);
