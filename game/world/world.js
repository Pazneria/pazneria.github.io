import {
  tileSize,
  mapWidth,
  mapHeight,
  chunkWidth,
  chunkHeight,
  resourceColors,
  defaultTileColor,
  resourceDefinitions,
} from '../config.js';
import { worldMap } from './chunks/index.js';
import { drawOutlinedImage } from '../renderUtils.js';

const outlinedTypes = new Set(['oakTree']);

export default class World {
  constructor() {
    this.chunkWidth = chunkWidth;
    this.chunkHeight = chunkHeight;
    this.images = {};
    this.resourceSprites = {};
    this.loadedChunks = new Map(); // key -> tile data
    this.worldMap = worldMap;

    const coords = Object.keys(worldMap).map((k) => k.split(',').map(Number));
    this.minChunkX = Math.min(...coords.map((c) => c[0]));
    this.minChunkY = Math.min(...coords.map((c) => c[1]));
    this.maxChunkX = Math.max(...coords.map((c) => c[0]));
    this.maxChunkY = Math.max(...coords.map((c) => c[1]));
    this.width = (this.maxChunkX - this.minChunkX + 1) * this.chunkWidth;
    this.height = (this.maxChunkY - this.minChunkY + 1) * this.chunkHeight;

    // Load initial 3x3 grid around (0,0)
    this.ensureChunksAround(0, 0);
  }

  loadChunk(cx, cy) {
    const key = `${cx},${cy}`;
    if (this.loadedChunks.has(key)) return;
    const chunk = this.worldMap[key];
    if (!chunk) return;
    const map = chunk.layout;
    const charMap = chunk.tiles || {};
    const tiles = [];
    for (let y = 0; y < this.chunkHeight; y++) {
      const row = map[y] || '';
      tiles[y] = [];
      for (let x = 0; x < this.chunkWidth; x++) {
        const ch = row[x] || '.';
        const type = charMap[ch] || 'empty';
        tiles[y][x] = { type, respawnType: null, respawnTicksRemaining: 0 };
      }
    }
    this.loadedChunks.set(key, tiles);
  }

  unloadChunk(cx, cy) {
    this.loadedChunks.delete(`${cx},${cy}`);
  }

  ensureChunksAround(x, y) {
    const centerX = Math.floor(x / this.chunkWidth);
    const centerY = Math.floor(y / this.chunkHeight);
    const required = new Set();
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const cx = centerX + dx;
        const cy = centerY + dy;
        required.add(`${cx},${cy}`);
        this.loadChunk(cx, cy);
      }
    }
    for (const key of Array.from(this.loadedChunks.keys())) {
      if (!required.has(key)) {
        this.loadedChunks.delete(key);
      }
    }
  }

  getTile(x, y) {
    const cx = Math.floor(x / this.chunkWidth);
    const cy = Math.floor(y / this.chunkHeight);
    const chunk = this.loadedChunks.get(`${cx},${cy}`);
    if (!chunk) return null;
    const lx = x - cx * this.chunkWidth;
    const ly = y - cy * this.chunkHeight;
    return chunk[ly]?.[lx] || null;
  }

  draw(ctx, cameraX = 0, cameraY = 0) {
    const baseX = Math.floor(cameraX);
    const baseY = Math.floor(cameraY);
    const offsetX = (baseX - cameraX) * tileSize;
    const offsetY = (baseY - cameraY) * tileSize;

    // Always paint a base color so missing tiles don't show the canvas background
    ctx.fillStyle = defaultTileColor;
    ctx.fillRect(0, 0, (mapWidth + 1) * tileSize, (mapHeight + 1) * tileSize);

    // Draw base terrain tiles
    const tileImg = this.images.tile;
    if (
      tileImg &&
      tileImg.complete &&
      tileImg.naturalWidth > 0 &&
      tileImg.naturalHeight > 0
    ) {
      const srcW = tileImg.naturalWidth;
      const srcH = tileImg.naturalHeight;
      for (let y = 0; y <= mapHeight; y++) {
        for (let x = 0; x <= mapWidth; x++) {
          ctx.drawImage(
            tileImg,
            0,
            0,
            srcW,
            srcH,
            offsetX + x * tileSize,
            offsetY + y * tileSize,
            tileSize,
            tileSize
          );
        }
      }
    }

    // Draw resources on top of terrain
    for (let vy = 0; vy <= mapHeight; vy++) {
      const wy = baseY + vy;
      const dy = offsetY + vy * tileSize;
      for (let vx = 0; vx <= mapWidth; vx++) {
        const wx = baseX + vx;
        const dx = offsetX + vx * tileSize;
        const tile = this.getTile(wx, wy);
        if (!tile || tile.type === 'empty') continue;
        const sprite = this.resourceSprites[tile.type];
        if (sprite && sprite.image.complete) {
          if (outlinedTypes.has(tile.type)) {
            drawOutlinedImage(
              ctx,
              sprite.image,
              sprite.sx,
              sprite.sy,
              tileSize,
              tileSize,
              dx,
              dy,
              tileSize,
              tileSize,
              '#003300'
            );
          } else {
            ctx.drawImage(
              sprite.image,
              sprite.sx,
              sprite.sy,
              tileSize,
              tileSize,
              dx,
              dy,
              tileSize,
              tileSize
            );
          }
        } else {
          ctx.fillStyle = resourceColors[tile.type];
          ctx.fillRect(dx, dy, tileSize, tileSize);
        }
      }
    }
  }

  getTileCoordinates(pixelX, pixelY, cameraX = 0, cameraY = 0) {
    const baseX = Math.floor(cameraX);
    const baseY = Math.floor(cameraY);
    const adjX = pixelX + (cameraX - baseX) * tileSize;
    const adjY = pixelY + (cameraY - baseY) * tileSize;
    return {
      x: Math.floor(adjX / tileSize) + baseX,
      y: Math.floor(adjY / tileSize) + baseY,
    };
  }

  isWithinBounds(x, y) {
    const cx = Math.floor(x / this.chunkWidth);
    const cy = Math.floor(y / this.chunkHeight);
    return this.worldMap[`${cx},${cy}`] !== undefined;
  }

  isWalkable(x, y) {
    const tile = this.getTile(x, y);
    return tile && tile.type === 'empty';
  }

  isResource(x, y) {
    const tile = this.getTile(x, y);
    return tile && tile.type !== 'empty';
  }

  gatherResourceAt(x, y, player) {
    const tile = this.getTile(x, y);
    if (!tile) return false;
    if (tile.type === 'empty') return false;
    const def = resourceDefinitions[tile.type];
    if (!def) return false;

    if (def.requiredTool && player.equipment.mainHand !== def.requiredTool) {
      return false;
    }

    player.inventory[tile.type] = (player.inventory[tile.type] || 0) + 1;
    const skill = player.skills[def.skill];
    if (skill) skill.xp += def.xpValue;

    tile.respawnType = tile.type;
    tile.respawnTicksRemaining = Math.floor(
      def.respawnMin + Math.random() * (def.respawnMax - def.respawnMin)
    );
    tile.type = 'empty';
    return true;
  }

  gatherAdjacentResources(cx, cy, player) {
    let count = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = cx + dx;
        const ny = cy + dy;
        if (this.gatherResourceAt(nx, ny, player)) {
          count += 1;
        }
      }
    }
    return count;
  }

  tick() {
    for (const [key, chunk] of this.loadedChunks.entries()) {
      for (let y = 0; y < this.chunkHeight; y++) {
        for (let x = 0; x < this.chunkWidth; x++) {
          const tile = chunk[y][x];
          if (tile.type === 'empty' && tile.respawnTicksRemaining > 0) {
            tile.respawnTicksRemaining -= 1;
            if (tile.respawnTicksRemaining <= 0 && tile.respawnType) {
              tile.type = tile.respawnType;
              tile.respawnType = null;
            }
          }
        }
      }
    }
  }

  findPath(startX, startY, endX, endY) {
    const directions = [
      { dx: 1, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 0, dy: -1 },
      { dx: 1, dy: 1 },
      { dx: 1, dy: -1 },
      { dx: -1, dy: 1 },
      { dx: -1, dy: -1 },
    ];
    const queue = [];
    let front = 0;
    const visited = new Set();
    const key = (x, y) => `${x},${y}`;
    queue.push({ x: startX, y: startY });
    const cameFrom = {};
    visited.add(key(startX, startY));
    let found = false;
    while (front < queue.length) {
      const current = queue[front++];
      if (current.x === endX && current.y === endY) {
        found = true;
        break;
      }
      for (const d of directions) {
        const nx = current.x + d.dx;
        const ny = current.y + d.dy;
        if (!this.isWithinBounds(nx, ny)) continue;
        if (Math.abs(d.dx) === 1 && Math.abs(d.dy) === 1) {
          if (
            !this.isWalkable(current.x + d.dx, current.y) ||
            !this.isWalkable(current.x, current.y + d.dy)
          ) {
            continue;
          }
        }
        if (!this.isWalkable(nx, ny)) continue;
        const k = key(nx, ny);
        if (!visited.has(k)) {
          visited.add(k);
          cameFrom[k] = current;
          queue.push({ x: nx, y: ny });
        }
      }
    }
    if (!found) return [];
    const path = [];
    let cx = endX;
    let cy = endY;
    while (!(cx === startX && cy === startY)) {
      path.push({ x: cx, y: cy });
      const prev = cameFrom[key(cx, cy)];
      cx = prev.x;
      cy = prev.y;
    }
    path.reverse();
    return path;
  }
}
