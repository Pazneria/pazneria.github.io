import Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.esm.js';
import Player from './player.js';
import World from './world.js';

class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
  }

  preload() {
    // Nothing to load for now since we use basic shapes
  }

  create() {
    // Create world and player
    this.world = new World(this);
    // spawn at center of map
    const startX = Math.floor(this.world.width / 2);
    const startY = Math.floor(this.world.height / 2);
    this.player = new Player(this, startX, startY);

    // Click/tap to move
    this.input.on('pointerup', (pointer) => {
      const worldPoint = pointer.positionToCamera(this.cameras.main);
      const tileX = Math.floor(worldPoint.x / this.world.tileSize);
      const tileY = Math.floor(worldPoint.y / this.world.tileSize);
      if (
        tileX >= 0 &&
        tileX < this.world.width &&
        tileY >= 0 &&
        tileY < this.world.height
      ) {
        this.player.moveTo(tileX, tileY);
      }
    });
  }

  update(time, delta) {
    this.player.update(time, delta);
  }
}

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#0b0f27',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: MainScene,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  }
};

new Phaser.Game(config);
