import { tileSize, playerColor } from '../config.js';

export default class Player {
  constructor(world, x, y) {
    this.world = world;
    this.x = x;
    this.y = y;
    // Pixel position for drawing center of tile
    this.pixelX = x * tileSize + tileSize / 2;
    this.pixelY = y * tileSize + tileSize / 2;
    // Load saved state
    const saved = JSON.parse(localStorage.getItem('pazneriaGameState') || '{}');
    this.skills = {
      mining: { xp: saved.skills?.mining?.xp || 0 },
      woodcutting: { xp: saved.skills?.woodcutting?.xp || 0 },
    };
    this.inventory = saved.inventory || {};
    this.equipment = saved.equipment || { mainHand: null };
    // Pathfinding and gathering state
    this.path = [];
    this.gatherTarget = null;

    // Sprite information; can be set externally
    this.spriteSheet = null;
    this.spriteOffsetX = 0;
    this.spriteOffsetY = 0;
  }

  moveTo(tileX, tileY) {
    const startX = this.x;
    const startY = this.y;
    // If target is a resource, path to an adjacent walkable tile
    if (this.world.isResource(tileX, tileY)) {
      const candidates = [];
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = tileX + dx;
          const ny = tileY + dy;
          if (this.world.isWalkable(nx, ny)) {
          const candidatePath = this.world.findPath(startX, startY, nx, ny);
          if (candidatePath && candidatePath.length > 0) {
            const dist = Math.hypot(startX - nx, startY - ny);
            candidates.push({ path: candidatePath, nx, ny, dist });
          }
          }
        }
      }
      if (candidates.length > 0) {
        candidates.sort((a, b) => {
          if (a.path.length === b.path.length) {
            return a.dist - b.dist;
          }
          return a.path.length - b.path.length;
        });
        this.path = candidates[0].path;
        this.gatherTarget = { x: tileX, y: tileY };
      } else if (Math.abs(tileX - startX) <= 1 && Math.abs(tileY - startY) <= 1) {
        // Already adjacent with no movement required
        this.path = [];
        this.gatherTarget = { x: tileX, y: tileY };
      }
    } else {
      const path = this.world.findPath(startX, startY, tileX, tileY);
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
      // If reached destination and have a gather target, collect only that tile
      if (this.gatherTarget) {
        const gx = this.gatherTarget.x;
        const gy = this.gatherTarget.y;
        if (Math.abs(gx - this.x) <= 1 && Math.abs(gy - this.y) <= 1) {
          this.world.gatherResourceAt(gx, gy, this);
          this.gatherTarget = null;
          this.saveState();
        }
      }
    }
  }

  draw(ctx, cameraX = 0, cameraY = 0) {
    const drawX = (this.x - cameraX) * tileSize;
    const drawY = (this.y - cameraY) * tileSize;
    if (this.spriteSheet && this.spriteSheet.complete) {
      ctx.drawImage(
        this.spriteSheet,
        this.spriteOffsetX,
        this.spriteOffsetY,
        tileSize,
        tileSize,
        drawX,
        drawY,
        tileSize,
        tileSize
      );
    } else {
      ctx.fillStyle = playerColor;
      ctx.fillRect(drawX + 3, drawY + 3, tileSize - 6, tileSize - 6);
    }
  }

  saveState() {
    const state = {
      skills: this.skills,
      inventory: this.inventory,
      equipment: this.equipment,
    };
    localStorage.setItem('pazneriaGameState', JSON.stringify(state));
  }
}
