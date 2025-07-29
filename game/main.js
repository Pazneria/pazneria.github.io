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
  let spawnX = saved.x !== undefined ? saved.x : Math.floor(mapWidth / 2);
  let spawnY = saved.y !== undefined ? saved.y : Math.floor(mapHeight / 2);
  // Ensure the spawn tile is always empty so the player doesn't start
  // on top of a resource node.
  if (world.isWithinBounds(spawnX, spawnY)) {
    world.tiles[spawnY][spawnX].type = 'empty';
  }
  player = new Player(world, spawnX, spawnY);

  canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    // Scale the click position from the displayed size back to the
    // canvas's internal coordinate system. Without this the player
    // would walk to the wrong tile when the canvas is stretched by CSS.
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const pixelX = (event.clientX - rect.left) * scaleX;
    const pixelY = (event.clientY - rect.top) * scaleY;
    const { x, y } = world.getTileCoordinates(pixelX, pixelY);
    player.moveTo(x, y);
  });

  setInterval(() => {
    player.update();
    world.tick();
  }, tickDuration);

  requestAnimationFrame(gameLoop);
}

function gameLoop() {
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  world.draw(ctx);
  player.draw(ctx);
  requestAnimationFrame(gameLoop);
}

window.addEventListener('DOMContentLoaded', createGame);
