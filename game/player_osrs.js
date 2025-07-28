import { tileSize, playerColor } from './config.js';

export default class Player {
  constructor(world, x, y) {
    this.world = world;
    this.x = x;
    this.y = y;
    // Pixel position for drawing center of tile
    this.pixelX = x * tileSize + tileSize / 2;
    this.pixelY = y * tileSize + tileSize / 2;
    // Load saved XP and inventory
    const saved = JSON.parse(localStorage.getItem('pazneriaGameState') || '{}');
    this.xp = saved.xp || 0;
    this.inventory = saved.inventory || {};
    // Pathfinding and gathering state
    this.path = [];
    this.gatherTarget = null;
  }

  moveTo(tileX, tileY) {
    // If target is a resource, path to an adjacent walkable tile
    if (this.world.isResource(tileX, tileY)) {
      const candidates = [];
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = tileX + dx;
          const ny = tileY + dy;
          if (this.world.isWalkable(nx, ny)) {
            const candidatePath = this.world.findPath(this.x, this.y, nx, ny);
            if (candidatePath.length > 0) {
              candidates.push({ path: candidatePath, nx, ny });
            }
          }
        }
      }
      if (candidates.length > 0) {
        candidates.sort((a, b) => a.path.length - b.path.length);
        this.path = candidates[0].path;
        this.gatherTarget = { x: tileX, y: tileY };
      }
    } else {
      const path = this.world.findPath(this.x, this.y, tileX, tileY);
      this.path = path;
      this.gatherTarget = null;
    }
  }

  update() {
    // Execute one step along path each tick
    if (this.path && this.path.length > 0) {
      const nextTile = this.path.shift();
      this.x = nextTile.x;
      this.y = nextTile.y;
      // Update pixel coordinates for drawing
      this.pixelX = this.x * tileSize + tileSize / 2;
      this.pixelY = this.y * tileSize + tileSize / 2;
    } else {
      // If reached destination and have a gather target, check adjacency and
      // collect from all surrounding tiles.
      if (this.gatherTarget) {
        const gx = this.gatherTarget.x;
        const gy = this.gatherTarget.y;
        if (Math.abs(gx - this.x) <= 1 && Math.abs(gy - this.y) <= 1) {
          this.world.gatherAdjacentResources(this.x, this.y, this);
          this.gatherTarget = null;
          this.saveState();
        }
      }
    }
  }

  draw(ctx) {
    ctx.fillStyle = playerColor;
    // Draw as a rectangle with margin for separation
    ctx.fillRect(this.x * tileSize + 3, this.y * tileSize + 3, tileSize - 6, tileSize - 6);
  }

  saveState() {
    const state = {
      xp: this.xp,
      inventory: this.inventory,
    };
    localStorage.setItem('pazneriaGameState', JSON.stringify(state));
  }
}
