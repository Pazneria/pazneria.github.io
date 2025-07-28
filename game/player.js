import Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.esm.js';

export default class Player {
  constructor(scene, world, x, y, config) {
    this.scene = scene;
    this.world = world;
    this.config = config;
    this.x = x;
    this.y = y;

    // Load saved XP/inventory from localStorage
    const savedState = JSON.parse(localStorage.getItem('pazneriaGameState') || '{}');
    this.xp = savedState.xp || 0;
    this.inventory = savedState.inventory || {};

    this.graphics = scene.add.circle(
      x * config.tileSize + config.tileSize / 2,
      y * config.tileSize + config.tileSize / 2,
      config.tileSize * 0.35,
      0x00ffab
    );
    this.graphics.setDepth(1);

    this.isMoving = false;
  }

  moveTo(tileX, tileY) {
    if (this.isMoving) return;
    this.isMoving = true;
    const duration = this.config.walkSpeed;
    const targetX = tileX * this.config.tileSize + this.config.tileSize / 2;
    const targetY = tileY * this.config.tileSize + this.config.tileSize / 2;
    this.scene.tweens.add({
      targets: this.graphics,
      x: targetX,
      y: targetY,
      duration,
      onComplete: () => {
        this.x = tileX;
        this.y = tileY;
        this.isMoving = false;
        // handle resource collection
        this.world.handleResourceAt(tileX, tileY);
        this.saveState();
      }
    });
  }

  update(time, delta) {
    // For future updates (animations, etc.)
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
