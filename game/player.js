import { tileSize, walkSpeed } from './config.js';
export default class Player {
  constructor(scene, world, x, y) {
    this.scene = scene;
    this.world = world;
    this.x = x;
    this.y = y;
    // Load saved XP/inventory from localStorage
    const savedState = JSON.parse(localStorage.getItem('pazneriaGameState') || '{}');
    this.xp = savedState.xp || 0;
    this.inventory = savedState.inventory || {};
    // Create player circle sprite
    this.graphics = scene.add.circle(
      x * tileSize + tileSize / 2,
      y * tileSize + tileSize / 2,
      tileSize * 0.35,
      0x00ffab
    );
    this.graphics.setDepth(1);
    this.isMoving = false;
  }

  moveTo(tileX, tileY) {
    if (this.isMoving) return;
    this.isMoving = true;
    const targetX = tileX * tileSize + tileSize / 2;
    const targetY = tileY * tileSize + tileSize / 2;
    this.scene.tweens.add({
      targets: this.graphics,
      x: targetX,
      y: targetY,
      duration: walkSpeed,
      onComplete: () => {
        this.x = tileX;
        this.y = tileY;
        this.isMoving = false;
        // Collect resources at the destination
        this.world.handleResourceAt(tileX, tileY, this);
        this.saveState();
      }
    });
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
