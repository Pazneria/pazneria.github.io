import { tileSize, mapWidth, mapHeight, backgroundColor, tickDuration } from './config.js';
import World from './world/world.js';
import Player from './entities/player.js';
import Camera from './camera.js';
import Minimap from './minimap.js';

// Load character sprite sheet and resource icons
const characterSprite = new Image();
characterSprite.src = new URL('./RPGCharacterSprites32x32.png', import.meta.url).href;
characterSprite.onload = () => {
  const off = document.createElement('canvas');
  off.width = characterSprite.width;
  off.height = characterSprite.height;
  const octx = off.getContext('2d');
  octx.drawImage(characterSprite, 0, 0);
  const imgData = octx.getImageData(0, 0, off.width, off.height);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] === 255 && data[i + 1] === 0 && data[i + 2] === 255) {
      data[i + 3] = 0;
    }
  }
  octx.putImageData(imgData, 0, 0);
  characterSprite.src = off.toDataURL();
};

const oreImage = new Image();
oreImage.src = new URL('./ore.png', import.meta.url).href;

const logImage = new Image();
logImage.src = new URL('./log.png', import.meta.url).href;

const tileImage = new Image();
tileImage.src = new URL('./Futuristic Industrial Tileset.png', import.meta.url).href;

let world;
let player;
let camera;
let minimap;
let canvas;
let ctx;
let lastFrameTime = 0;

function createGame() {
  const container = document.getElementById('game-container');
  // The container's vertical offset and height are now controlled via CSS
  // variables, so no explicit margin needs to be applied here.
  container.innerHTML = '';
  canvas = document.createElement('canvas');
  canvas.id = 'game-canvas';
  canvas.width = mapWidth * tileSize;
  canvas.height = mapHeight * tileSize;
  container.appendChild(canvas);
  ctx = canvas.getContext('2d');

  world = new World();
  // Provide resource and tile images to the world
  world.images = { ore: oreImage, logs: logImage, tile: tileImage };
  const saved = JSON.parse(localStorage.getItem('pazneriaGameState')) || {};
  let spawnX = saved.x !== undefined ? saved.x : Math.floor(world.width / 2);
  let spawnY = saved.y !== undefined ? saved.y : Math.floor(world.height / 2);
  // Ensure the spawn tile is always empty so the player doesn't start
  // on top of a resource node.
  if (world.isWithinBounds(spawnX, spawnY)) {
    world.tiles[spawnY][spawnX].type = 'empty';
  }
  player = new Player(world, spawnX, spawnY);
  // Assign sprite sheet to the player
  player.spriteSheet = characterSprite;
  player.spriteOffsetX = 0;
  player.spriteOffsetY = tileSize * 2; // use third row of the sprite sheet
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
