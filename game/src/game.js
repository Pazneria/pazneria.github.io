import { World, TILE_SIZE } from './world.js';
import { Player } from './player.js';
import { UI } from './ui.js';
import { loadData } from './utils.js';
import { registerWoodcutting } from './skills/woodcutting.js';

const TICK_MS = 600;

const inputState = {
  up: false,
  down: false,
  left: false,
  right: false,
  action: false
};

document.addEventListener('keydown', (event) => {
  if (event.repeat) return;
  switch (event.key) {
    case 'ArrowUp':
    case 'w':
      inputState.up = true;
      break;
    case 'ArrowDown':
    case 's':
      inputState.down = true;
      break;
    case 'ArrowLeft':
    case 'a':
      inputState.left = true;
      break;
    case 'ArrowRight':
    case 'd':
      inputState.right = true;
      break;
    case ' ':
    case 'Enter':
      inputState.action = true;
      break;
    default:
      break;
  }
});

document.addEventListener('keyup', (event) => {
  switch (event.key) {
    case 'ArrowUp':
    case 'w':
      inputState.up = false;
      break;
    case 'ArrowDown':
    case 's':
      inputState.down = false;
      break;
    case 'ArrowLeft':
    case 'a':
      inputState.left = false;
      break;
    case 'ArrowRight':
    case 'd':
      inputState.right = false;
      break;
    case ' ':
    case 'Enter':
      inputState.action = false;
      break;
    default:
      break;
  }
});

async function init() {
  const canvas = document.getElementById('game-canvas');
  const inventoryEl = document.getElementById('inventory');
  const logEl = document.getElementById('log');

  if (!canvas || !inventoryEl || !logEl) {
    console.error('Game root elements missing');
    return;
  }

  const ctx = canvas.getContext('2d');
  const data = await loadData();

  const world = new World(data.region, data.objects);
  const player = new Player(world, data.items);
  const ui = new UI({ inventoryEl, logEl, items: data.items });

  const woodcutting = registerWoodcutting({ player, world, ui, items: data.items });

  const tick = () => {
    const performedAction = player.update(inputState);
    if (performedAction) {
      const target = world.objectAt(player.x, player.y) ?? world.objectAt(player.x, player.y - 1);
      if (target && target.skill === 'woodcutting') {
        woodcutting(target);
      } else if (target) {
        ui.log(`You inspect the ${target.definition.name}.`);
      } else {
        ui.log('There is nothing interesting here.');
      }
      inputState.action = false;
    }

    world.draw(ctx);
    drawPlayer(ctx, player);
    ui.renderInventory(player.inventory);
  };

  tick();
  setInterval(tick, TICK_MS);
  ui.log('Welcome to the starter clearing. Try chopping a tree.');
}

function drawPlayer(ctx, player) {
  ctx.fillStyle = '#f5f7fa';
  ctx.fillRect(player.x * TILE_SIZE + 8, player.y * TILE_SIZE + 8, TILE_SIZE - 16, TILE_SIZE - 16);
}

init();
