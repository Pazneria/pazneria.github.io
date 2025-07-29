import { tileSize, mapWidth, mapHeight, backgroundColor, tickDuration } from './config.js';
import World from './world/world.js';
import Player from './entities/player.js';
import Camera from './camera.js';
import Minimap from './minimap.js';

let world;
let player;
let camera;
let minimap;
let canvas;
let ctx;
let lastFrameTime = 0;

function createGame() {
  const container = document.getElementById('game-container');
  // Shift the entire game container down by two tiles so the
  // canvas isn't flush against the header. The tileSize constant
  // is defined in config.js, so this offset will automatically
  // adjust if the tile dimensions change.
  container.style.marginTop = `${tileSize * 2}px`;
  container.innerHTML = '';
  canvas = document.createElement('canvas');
  canvas.id = 'game-canvas';
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
  camera = new Camera(world, player);
  minimap = new Minimap(world, player);
  minimap.attach(container);

  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  canvas.addEventListener('mousedown', () => {
    // Center the game container in the viewport when the player interacts
    container.scrollIntoView({ behavior: 'smooth', block: 'center' });
    document.body.classList.add('game-focused');
  });

  document.addEventListener('mousedown', (e) => {
    if (!container.contains(e.target)) {
      document.body.classList.remove('game-focused');
    }
  });

  canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const pixelX = (event.clientX - rect.left) * scaleX;
    const pixelY = (event.clientY - rect.top) * scaleY;
    const { x, y } = world.getTileCoordinates(pixelX, pixelY, camera.x, camera.y);
    player.moveTo(x, y);
  });

  setInterval(() => {
    player.update();
    world.tick();
    camera.checkPlayerMovement();
  }, tickDuration);

  lastFrameTime = performance.now();
  requestAnimationFrame(gameLoop);
}

function gameLoop(timestamp) {
  const delta = timestamp - lastFrameTime;
  lastFrameTime = timestamp;
  camera.update(delta);

  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  world.draw(ctx, camera.x, camera.y);
  player.draw(ctx, camera.x, camera.y);
  minimap.draw();
  requestAnimationFrame(gameLoop);
}

window.addEventListener('DOMContentLoaded', createGame);
