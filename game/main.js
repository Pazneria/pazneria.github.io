import { tileSize, mapWidth, mapHeight, backgroundColor, tickRate } from './config.js';
import World from './world.js';
import Player from './player_osrs.js';

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
  player = new Player(world, spawnX, spawnY);

  canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const pixelX = event.clientX - rect.left;
    const pixelY = event.clientY - rect.top;
    const { x, y } = world.getTileCoordinates(pixelX, pixelY);
    player.moveTo(x, y);
  });

  setInterval(() => {
    player.update();
    world.tick();
  }, 1000 / tickRate);

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
