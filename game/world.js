import { tileSize, mapWidth, mapHeight, resourceColors, defaultTileColor, resourceRespawnTicks } from './config.js';

export default class World {
  constructor() {
    this.width = mapWidth;
    this.height = mapHeight;
    this.tiles = [];
    this.generateTiles();
  }

  generateTiles() {
    // Initialize tiles with random resources
    for (let y = 0; y < this.height; y++) {
      this.tiles[y] = [];
      for (let x = 0; x < this.width; x++) {
        let type = 'empty';
        const rnd = Math.random();
        // 5% chance for ore, next 5% for scrap
        if (rnd < 0.05) {
          type = 'ore';
        } else if (rnd < 0.10) {
          type = 'scrap';
        }
        this.tiles[y][x] = {
          type: type,
          respawnType: null,
          respawnTicksRemaining: 0,
        };
      }
    }
  }

  draw(ctx) {
    // Fill background
    ctx.fillStyle = defaultTileColor;
    ctx.fillRect(0, 0, this.width * tileSize, this.height * tileSize);
    // Draw resources
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const tile = this.tiles[y][x];
        if (tile.type !== 'empty') {
          ctx.fillStyle = resourceColors[tile.type];
          ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
        }
      }
    }
    // Optionally draw grid lines (thin)
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 1;
    for (let x = 0; x <= this.width; x++) {
      ctx.beginPath();
      ctx.moveTo(x * tileSize, 0);
      ctx.lineTo(x * tileSize, this.height * tileSize);
      ctx.stroke();
    }
    for (let y = 0; y <= this.height; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * tileSize);
      ctx.lineTo(this.width * tileSize, y * tileSize);
      ctx.stroke();
    }
  }

  getTileCoordinates(pixelX, pixelY) {
    return {
      x: Math.floor(pixelX / tileSize),
      y: Math.floor(pixelY / tileSize),
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
    // Award XP and inventory based on resource type
    if (tile.type === 'ore' || tile.type === 'scrap') {
      player.xp += 1;
      player.inventory[tile.type] = (player.inventory[tile.type] || 0) + 1;
      // Set respawn info and clear tile. Respawn times are defined in ticks,
      // so no conversion is needed here.
      tile.respawnType = tile.type;
      tile.respawnTicksRemaining = Math.floor(
        resourceRespawnTicks[tile.type].min +
          Math.random() *
            (resourceRespawnTicks[tile.type].max -
              resourceRespawnTicks[tile.type].min)
      );
      tile.type = 'empty';
      return true;
    }
    return false;
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
    const visited = new Set();
    const key = (x, y) => `${x},${y}`;
    queue.push({ x: startX, y: startY });
    const cameFrom = {};
    visited.add(key(startX, startY));
    let found = false;
    while (queue.length > 0) {
      const current = queue.shift();
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
