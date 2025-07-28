import { tileSize, walkSpeed, playerColor } from './config.js';

// The Player class manages the avatar's position, movement and
// persistence. It moves smoothly between tiles and handles
// resource collection via the world.
export default class Player {
  constructor(world, x, y) {
    this.world = world;
    // Tile coordinates
    this.x = x;
    this.y = y;
    // Pixel coordinates for smooth movement
    this.pixelX = x * tileSize + tileSize / 2;
    this.pixelY = y * tileSize + tileSize / 2;

    // Load saved XP and inventory
    const saved = JSON.parse(localStorage.getItem('pazneriaGameState') || '{}');
    this.xp = saved.xp || 0;
    this.inventory = saved.inventory || {};

    this.targetTileX = x;
    this.targetTileY = y;
    this.targetPixelX = this.pixelX;
    this.targetPixelY = this.pixelY;
    this.isMoving = false;
  }

  moveTo(tileX, tileY) {
    if (this.isMoving) return;
    this.targetTileX = tileX;
    this.targetTileY = tileY;
    this.targetPixelX = tileX * tileSize + tileSize / 2;
    this.targetPixelY = tileY * tileSize + tileSize / 2;
    this.isMoving = true;
  }

  update() {
    if (!this.isMoving) return;
    const dx = this.targetPixelX - this.pixelX;
    const dy = this.targetPixelY - this.pixelY;
    const dist = Math.hypot(dx, dy);
    if (dist < walkSpeed) {
      // Snap to destination
      this.pixelX = this.targetPixelX;
      this.pixelY = this.targetPixelY;
      this.x = this.targetTileX;
      this.y = this.targetTileY;
      this.isMoving = false;
      // Collect any resource on arrival
      this.world.handleResourceAt(this.x, this.y, this);
      this.saveState();
    } else {
      const stepX = (dx / dist) * walkSpeed;
      const stepY = (dy / dist) * walkSpeed;
      this.pixelX += stepX;
      this.pixelY += stepY;
    }
  }

  draw(ctx) {
    ctx.fillStyle = playerColor;
    ctx.beginPath();
    ctx.arc(this.pixelX, this.pixelY, tileSize * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }

  saveState() {
    const state = {
      x: this.x,
      y: this.y,
      xp: this.xp,
      inventory: this.inventory
    };
    localStorage.setItem('pazneriaGameState', JSON.stringify(state));
  }
}
