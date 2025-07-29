import assert from 'node:assert/strict';
import { test } from 'node:test';
import World from '../game/world.js';
import Player from '../game/player_osrs.js';

function setupWorld() {
  const world = new World();
  // Clear map and place two resources next to player start
  for (let y = 0; y < world.height; y++) {
    for (let x = 0; x < world.width; x++) {
      world.tiles[y][x].type = 'empty';
    }
  }
  world.tiles[0][1] = { type: 'ore', respawnType: null, respawnTicksRemaining: 0 };
  world.tiles[1][1] = { type: 'scrap', respawnType: null, respawnTicksRemaining: 0 };
  return world;
}

test('player gathers only the targeted resource', () => {
  globalThis.localStorage = {
    getItem() { return null; },
    setItem() {}
  };
  const world = setupWorld();
  const player = new Player(world, 0, 0);

  // Target the ore at (1,0)
  player.gatherTarget = { x: 1, y: 0 };
  player.update();

  assert.equal(world.tiles[0][1].type, 'empty');
  assert.equal(world.tiles[1][1].type, 'scrap');
  assert.equal(player.inventory.ore, 1);
  assert.ok(!player.inventory.scrap);
});
