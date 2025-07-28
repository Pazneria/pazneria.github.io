import assert from 'node:assert/strict';
import World from '../game/world.js';

// Dummy player object for gathering resources
function createPlayer() {
  return { xp: 0, inventory: {} };
}

// Ensure deterministic tile for testing
function setupWorldWithResource() {
  const world = new World();
  world.tiles[0][0] = {
    type: 'ore',
    respawnType: null,
    respawnTicksRemaining: 0
  };
  return world;
}

import { test } from 'node:test';

// Test that resources respawn after their timer expires

test('gathering a resource respawns after the configured number of ticks', () => {
  const world = setupWorldWithResource();
  const player = createPlayer();

  const gathered = world.gatherResourceAt(0, 0, player);
  assert.ok(gathered, 'resource should be gathered');

  const tile = world.tiles[0][0];
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
