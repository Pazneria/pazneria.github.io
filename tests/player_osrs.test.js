import assert from 'node:assert/strict';
import { test } from 'node:test';
import World from '../game/world/world.js';
import Player from '../game/entities/player.js';

function setupWorld() {
  const world = new World();
  // Clear map and place two resources next to player start
  for (let cy = world.minChunkY; cy <= world.maxChunkY; cy++) {
    for (let cx = world.minChunkX; cx <= world.maxChunkX; cx++) {
      world.loadChunk(cx, cy);
      for (let y = 0; y < world.chunkHeight; y++) {
        for (let x = 0; x < world.chunkWidth; x++) {
          world.getTile(cx * world.chunkWidth + x, cy * world.chunkHeight + y).type = 'empty';
        }
      }
    }
  }
  world.getTile(1, 0).type = 'copperOre';
  world.getTile(1, 1).type = 'oakTree';
  return world;
}

test('player gathers only the targeted resource', () => {
  globalThis.localStorage = {
    getItem() { return null; },
    setItem() {}
  };
  const world = setupWorld();
  const player = new Player(world, 0, 0);
  player.equipment.mainHand = 'pickaxe';

  // Target the ore at (1,0)
  player.gatherTarget = { x: 1, y: 0 };
  player.update();

  assert.equal(world.getTile(1, 0).type, 'empty');
  assert.equal(world.getTile(1, 1).type, 'oakTree');
  assert.equal(player.inventory.copperOre, 1);
  assert.ok(!player.inventory.oakTree);
});

test('player chooses the closest adjacent tile to gather', () => {
  globalThis.localStorage = {
    getItem() { return null; },
    setItem() {}
  };
  const world = new World();
  for (let cy = world.minChunkY; cy <= world.maxChunkY; cy++) {
    for (let cx = world.minChunkX; cx <= world.maxChunkX; cx++) {
      world.loadChunk(cx, cy);
      for (let y = 0; y < world.chunkHeight; y++) {
        for (let x = 0; x < world.chunkWidth; x++) {
          world.getTile(cx * world.chunkWidth + x, cy * world.chunkHeight + y).type = 'empty';
        }
      }
    }
  }
  world.getTile(3, 1).type = 'copperOre';

  const player = new Player(world, 1, 1);

  player.moveTo(3, 1);

  // The first step in the path should be to the tile east of the start (2,1)
  assert.equal(player.path[0].x, 2);
  assert.equal(player.path[0].y, 1);
});
