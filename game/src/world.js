import { instantiateObjects } from './objects.js';

const TILE_SIZE = 32;
const TILE_COLORS = {
  grass: '#1f6f2f',
  water: '#1c4b82',
  sand: '#ba9b65',
  stone: '#686868'
};

export class World {
  constructor(regionData, objectDefinitions) {
    this.name = regionData.name;
    this.width = regionData.width;
    this.height = regionData.height;
    this.tiles = regionData.tiles;
    this.spawn = regionData.spawn ?? { x: Math.floor(this.width / 2), y: Math.floor(this.height / 2) };
    this.objects = instantiateObjects(regionData.objects ?? [], objectDefinitions);
    this.objectDefinitions = objectDefinitions;
  }

  tileAt(x, y) {
    if (!this.inBounds(x, y)) return 'void';
    return this.tiles[y][x];
  }

  inBounds(x, y) {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  isBlocked(x, y) {
    if (!this.inBounds(x, y)) return true;
    const tile = this.tileAt(x, y);
    if (tile === 'water') return true;
    return this.objects.some((obj) => obj.x === x && obj.y === y && obj.isSolid && obj.state === 'default');
  }

  objectAt(x, y) {
    return this.objects.find((obj) => obj.x === x && obj.y === y);
  }

  replaceObject(target, replacementId) {
    const index = this.objects.indexOf(target);
    const definition = this.objectDefinitions.find((obj) => obj.id === replacementId);
    if (index === -1 || !definition) return;
    this.objects[index] = instantiateObjects([{ id: replacementId, x: target.x, y: target.y }], this.objectDefinitions)[0];
  }

  removeObject(target) {
    this.objects = this.objects.filter((obj) => obj !== target);
  }

  draw(ctx) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        const tile = this.tileAt(x, y);
        ctx.fillStyle = TILE_COLORS[tile] ?? '#101419';
        ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    }

    this.objects.forEach((obj) => {
      ctx.fillStyle = obj.definition.color ?? '#8ccf3f';
      if (obj.state === 'stump' && obj.definition.states?.stump?.color) {
        ctx.fillStyle = obj.definition.states.stump.color;
      }
      ctx.fillRect(obj.x * TILE_SIZE + 4, obj.y * TILE_SIZE + 4, TILE_SIZE - 8, TILE_SIZE - 8);
    });
  }
}

export { TILE_SIZE };
