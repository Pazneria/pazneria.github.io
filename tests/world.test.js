import assert from 'node:assert/strict';
import World from '../game/world/world.js';

// Dummy player object for gathering resources
function createPlayer() {
  return {
    skills: { mining: { xp: 0 }, woodcutting: { xp: 0 } },
    inventory: {},
    equipment: { mainHand: 'pickaxe' },
  };
}

// Ensure deterministic tile for testing
function setupWorldWithResource() {
  const world = new World();
  const tile = world.getTile(0, 0);
  tile.type = 'ore';
  tile.respawnType = null;
  tile.respawnTicksRemaining = 0;
  return world;
}

import { test } from 'node:test';

// Test that resources respawn after their timer expires

test('gathering a resource respawns after the configured number of ticks', () => {
  const world = setupWorldWithResource();
  const player = createPlayer();

  const gathered = world.gatherResourceAt(0, 0, player);
  assert.ok(gathered, 'resource should be gathered');

  const tile = world.getTile(0, 0);
  assert.equal(tile.type, 'empty', 'tile is empty after gathering');
  const ticks = tile.respawnTicksRemaining;
  const respawnType = tile.respawnType;

  for (let i = 0; i < ticks; i++) {
    world.tick();
  }

  assert.equal(tile.type, respawnType, 'resource respawned after expected ticks');
  assert.equal(tile.respawnType, null, 'respawnType cleared');
  assert.equal(tile.respawnTicksRemaining, 0, 'respawn timer reset');
});

// Test gathering multiple resources around a center tile
test('gatherAdjacentResources collects from all neighbouring tiles', () => {
  const world = new World();
  const player = createPlayer();

  // Place three resources around (0,0)
  world.getTile(1, 0).type = 'ore';
  world.getTile(0, 1).type = 'logs';
  world.getTile(1, 1).type = 'ore';

  const count = world.gatherAdjacentResources(0, 0, player);

  assert.equal(count, 2, 'gathered two resources with pickaxe');
  assert.equal(world.getTile(1, 0).type, 'empty');
  assert.equal(world.getTile(1, 1).type, 'empty');
  assert.equal(world.getTile(0, 1).type, 'logs');
});
