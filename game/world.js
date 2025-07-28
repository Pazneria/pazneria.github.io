import { tileSize, mapWidth, mapHeight, resourceColors } from './config.js';

export default class World {
  constructor(scene) {
    this.scene = scene;
    this.tiles = [];
    this.generateTiles();
  }

  generateTiles() {
    for (let y = 0; y < mapHeight; y++) {
      this.tiles[y] = [];
      for (let x = 0; x < mapWidth; x++) {
        // assign random resources: 5% ore, additional 5% scrap
        let type = 'empty';
        const rand = Math.random();
        if (rand < 0.05) {
          type = 'ore';
        } else if (rand < 0.10) {
          type = 'scrap';
        }
        const rect = this.scene.add.rectangle(
          x * tileSize + tileSize / 2,
          y * tileSize + tileSize / 2,
          tileSize - 2,
          tileSize - 2,
          this.getTileColor(type)
        );
        rect.setStrokeStyle(1, 0x2a3359);
        this.tiles[y][x] = { type, rect };
      }
    }
  }

  getTileColor(type) {
    if (type === 'ore') return resourceColors.ore;
    if (type === 'scrap') return resourceColors.scrap;
    return 0x1a253a; // default base tile color
  }

  getTileCoordinates(worldX, worldY) {
    const x = Math.floor(worldX / tileSize);
    const y = Math.floor(worldY / tileSize);
    return { x, y };
  }

  isWithinBounds(x, y) {
    return x >= 0 && y >= 0 && x < mapWidth && y < mapHeight;
  }

  isWalkable(x, y) {
    return this.isWithinBounds(x, y);
  }

  getTileAt(x, y) {
    if (!this.isWithinBounds(x, y)) return null;
    return this.tiles[y][x];
  }

  handleResourceAt(x, y, player) {
    const tile = this.getTileAt(x, y);
    if (!tile) return;
    if (tile.type === 'ore' || tile.type === 'scrap') {
      // increment player's inventory and xp
      if (!player.inventory[tile.type]) {
        player.inventory[tile.type] = 0;
      }
      player.inventory[tile.type] += 1;
      player.xp += 1;
      // change tile to empty and update color
      tile.type = 'empty';
      tile.rect.fillColor = this.getTileColor('empty');
      // trigger a small tint flash as feedback
      this.scene.tweens.add({
        targets: tile.rect,
        alpha: { from: 1, to: 0.4 },
        yoyo: true,
        duration: 100,
        repeat: 2
      });
    }
  }
}
