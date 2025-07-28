import { tileSize, mapWidth, mapHeight, resourceColors, defaultTileColor } from './config.js';

// The World class encapsulates the tile grid and resource logic.
// It generates a map of randomly placed resources and knows how
// to draw itself to a Canvas 2D context. Tiles store only
// their type; drawing is delegated to the draw() method.
export default class World {
  constructor() {
    this.tiles = [];
    this.generateTiles();
  }

  generateTiles() {
    for (let y = 0; y < mapHeight; y++) {
      this.tiles[y] = [];
      for (let x = 0; x < mapWidth; x++) {
        let type = 'empty';
        const rand = Math.random();
        if (rand < 0.05) {
          type = 'ore';
        } else if (rand < 0.10) {
          type = 'scrap';
        }
        this.tiles[y][x] = { type };
      }
    }
  }

  getTileColor(type) {
    if (type === 'ore') return resourceColors.ore;
    if (type === 'scrap') return resourceColors.scrap;
    return defaultTileColor;
  }

  // Render all tiles to the provided canvas context. A small
  // margin around each tile is left to create grid lines.
  draw(ctx) {
    for (let y = 0; y < mapHeight; y++) {
      for (let x = 0; x < mapWidth; x++) {
        ctx.fillStyle = this.getTileColor(this.tiles[y][x].type);
        ctx.fillRect(x * tileSize + 1, y * tileSize + 1, tileSize - 2, tileSize - 2);
      }
    }
  }

  getTileCoordinates(pixelX, pixelY) {
    return {
      x: Math.floor(pixelX / tileSize),
      y: Math.floor(pixelY / tileSize)
    };
  }

  isWithinBounds(x, y) {
    return x >= 0 && y >= 0 && x < mapWidth && y < mapHeight;
  }

  isWalkable(x, y) {
    return this.isWithinBounds(x, y);
  }

  handleResourceAt(x, y, player) {
    if (!this.isWithinBounds(x, y)) return;
    const tile = this.tiles[y][x];
    if (tile.type === 'ore' || tile.type === 'scrap') {
      player.inventory[tile.type] = (player.inventory[tile.type] || 0) + 1;
      player.xp += 1;
      tile.type = 'empty';
    }
  }
}
