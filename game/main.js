import Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3.70.0/dist/phaser.esm.js';
import { tileSize, mapWidth, mapHeight, backgroundColor } from './config.js';
import Player from './player.js';
import World from './world.js';

class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
  }

  create() {
    // create world and player
    this.world = new World(this);
    this.player = new Player(this, this.world);

    // handle pointer or tap input
    this.input.on('pointerup', (pointer) => {
      const { x, y } = this.world.getTileCoordinates(pointer.x, pointer.y);
      if (this.world.isWalkable(x, y)) {
        this.player.moveTo(x, y, this.world);
      }
    });

    // camera bounds and centering
    this.cameras.main.setBounds(0, 0, mapWidth * tileSize, mapHeight * tileSize);
    this.cameras.main.centerOn(mapWidth * tileSize / 2, mapHeight * tileSize / 2);
  }
}

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: backgroundColor,
  width: mapWidth * tileSize,
  height: mapHeight * tileSize,
  scene: MainScene,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};

new Phaser.Game(config);
