import {
  tileSize,
  mapWidth,
  mapHeight,
  chunkWidth,
  chunkHeight,
  resourceColors,
  defaultTileColor,
  resourceDefinitions,
} from '../config.js';
import { defaultMap } from './maps/default.js';

export default class World {
  constructor(chunkRadius = 1) {
    this.chunkWidth = chunkWidth;
    this.chunkHeight = chunkHeight;
    this.tiles = [];
    this.width = 0;
    this.height = 0;
    this.chunks = new Set();

    for (let cy = 0; cy <= chunkRadius * 2; cy++) {
      for (let cx = 0; cx <= chunkRadius * 2; cx++) {
        this.addChunk(cx, cy);
      }
    }
  }

  addChunk(cx, cy, map = defaultMap) {
    const offsetX = cx * this.chunkWidth;
    const offsetY = cy * this.chunkHeight;
    for (let y = 0; y < this.chunkHeight; y++) {
      const globalY = offsetY + y;
      if (!this.tiles[globalY]) this.tiles[globalY] = [];
      const row = map[y] || '';
      for (let x = 0; x < this.chunkWidth; x++) {
        const globalX = offsetX + x;
        const ch = row[x] || '.';
        let type = 'empty';
        if (ch === 'o') type = 'ore';
        else if (ch === 't') type = 'logs';
        this.tiles[globalY][globalX] = {
          type,
          respawnType: null,
          respawnTicksRemaining: 0,
        };
      }
    }
    this.width = Math.max(this.width, offsetX + this.chunkWidth);
    this.height = Math.max(this.height, offsetY + this.chunkHeight);
    this.chunks.add(`${cx},${cy}`);
  }

  draw(ctx, cameraX = 0, cameraY = 0) {
    // Fill background for the visible area
    ctx.fillStyle = defaultTileColor;
    ctx.fillRect(0, 0, mapWidth * tileSize, mapHeight * tileSize);

    // Draw resources within the viewport
    for (let vy = 0; vy < mapHeight; vy++) {
      const wy = cameraY + vy;
      if (!this.tiles[wy]) continue;
      for (let vx = 0; vx < mapWidth; vx++) {
        const wx = cameraX + vx;
        const tile = this.tiles[wy][wx];
        if (!tile) continue;
        if (tile.type !== 'empty') {
          ctx.fillStyle = resourceColors[tile.type];
          ctx.fillRect(vx * tileSize, vy * tileSize, tileSize, tileSize);
        }
      }
    }

    // Optional grid lines
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 1;
    for (let x = 0; x <= mapWidth; x++) {
      ctx.beginPath();
      ctx.moveTo(x * tileSize, 0);
      ctx.lineTo(x * tileSize, mapHeight * tileSize);
      ctx.stroke();
    }
    for (let y = 0; y <= mapHeight; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * tileSize);
      ctx.lineTo(mapWidth * tileSize, y * tileSize);
      ctx.stroke();
    }
  }

  getTileCoordinates(pixelX, pixelY, cameraX = 0, cameraY = 0) {
    return {
      x: Math.floor(pixelX / tileSize) + cameraX,
      y: Math.floor(pixelY / tileSize) + cameraY,
    };
  }

  isWithinBounds(x, y) {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  isWalkable(x, y) {
    // Tiles with resources are not walkable
    return this.isWithinBounds(x, y) && this.tiles[y][x].type === 'empty';
  }

  isResource(x, y) {
    return this.isWithinBounds(x, y) && this.tiles[y][x].type !== 'empty';
  }

  gatherResourceAt(x, y, player) {
    if (!this.isResource(x, y)) return false;
    const tile = this.tiles[y][x];
    const def = resourceDefinitions[tile.type];
    if (!def) return false;

    if (def.requiredTool && player.equipment.mainHand !== def.requiredTool) {
      return false;
    }

    player.inventory[tile.type] = (player.inventory[tile.type] || 0) + 1;
    const skill = player.skills[def.skill];
    if (skill) skill.xp += def.xpValue;

    tile.respawnType = tile.type;
    tile.respawnTicksRemaining = Math.floor(
      def.respawnMin + Math.random() * (def.respawnMax - def.respawnMin)
    );
    tile.type = 'empty';
    return true;
  }

  // Gather resources from all tiles adjacent (including diagonally) to the
  // specified center tile. Returns the number of resources gathered.
  gatherAdjacentResources(cx, cy, player) {
    let count = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = cx + dx;
        const ny = cy + dy;
        if (this.gatherResourceAt(nx, ny, player)) {
          count += 1;
        }
      }
    }
    return count;
  }

  tick() {
    // Decrease respawn timers and restore resources when timer hits zero
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const tile = this.tiles[y][x];
        if (tile.type === 'empty' && tile.respawnTicksRemaining > 0) {
          tile.respawnTicksRemaining -= 1;
          if (tile.respawnTicksRemaining <= 0 && tile.respawnType) {
            tile.type = tile.respawnType;
            tile.respawnType = null;
          }
        }
      }
    }
  }

  findPath(startX, startY, endX, endY) {
    // Breadth-first search for pathfinding (8 directions, avoid diagonal clipping)
    const directions = [
      { dx: 1, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 0, dy: -1 },
      { dx: 1, dy: 1 },
      { dx: 1, dy: -1 },
      { dx: -1, dy: 1 },
      { dx: -1, dy: -1 },
    ];
    const queue = [];
    let front = 0;
    const visited = new Set();
    const key = (x, y) => `${x},${y}`;
    queue.push({ x: startX, y: startY });
    const cameFrom = {};
    visited.add(key(startX, startY));
    let found = false;
    while (front < queue.length) {
      const current = queue[front++];
      if (current.x === endX && current.y === endY) {
        found = true;
        break;
      }
      for (const d of directions) {
        const nx = current.x + d.dx;
        const ny = current.y + d.dy;
        if (!this.isWithinBounds(nx, ny)) continue;
        // For diagonal movement, ensure both orthogonal neighbours are walkable (no cutting corners)
        if (Math.abs(d.dx) === 1 && Math.abs(d.dy) === 1) {
          if (
            !this.isWalkable(current.x + d.dx, current.y) ||
            !this.isWalkable(current.x, current.y + d.dy)
          ) {
            continue;
          }
        }
        if (!this.isWalkable(nx, ny)) continue;
        const k = key(nx, ny);
        if (!visited.has(k)) {
          visited.add(k);
          cameFrom[k] = current;
          queue.push({ x: nx, y: ny });
        }
      }
    }
    if (!found) return [];
    // Reconstruct path
    const path = [];
    let cx = endX;
    let cy = endY;
    while (!(cx === startX && cy === startY)) {
      path.push({ x: cx, y: cy });
      const prev = cameFrom[key(cx, cy)];
      cx = prev.x;
      cy = prev.y;
    }
    path.reverse();
    return path;
  }
}
