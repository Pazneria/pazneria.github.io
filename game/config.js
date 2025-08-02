export const tileSize = 32;
// Size of the visible viewport in tiles
export const mapWidth = 20;
export const mapHeight = 15;

// Size of a single chunk. The initial world is composed of multiple chunks
// stitched together.
export const chunkWidth = 20;
export const chunkHeight = 15;

// Game time is measured exclusively in ticks. 100 ticks per minute means
// one tick every 600ms.
export const ticksPerMinute = 100; // ticks per minute
export const tickDuration = 60000 / ticksPerMinute; // milliseconds per tick

export const backgroundColor = '#0b0f27';

export const defaultTileColor = '#1a253a';

export const resourceColors = {
  copperOre: '#c08050',
  tinOre: '#aaaaaa',
  oakTree: '#aa8844',
};

export const resourceImagePaths = {
  copperOre: '../game_assets/assets/ores/copper/copper.png',
  tinOre: '../game_assets/assets/ores/tin/tin.png',
  oakTree: '../game_assets/assets/trees/oak/oak.png',
};

export const resourceDefinitions = {
  copperOre: {
    xpValue: 10,
    requiredTool: 'pickaxe',
    respawnMin: 17,
    respawnMax: 34,
    skill: 'mining',
  },
  tinOre: {
    xpValue: 10,
    requiredTool: 'pickaxe',
    respawnMin: 17,
    respawnMax: 34,
    skill: 'mining',
  },
  oakTree: {
    xpValue: 8,
    requiredTool: 'axe',
    respawnMin: 17,
    respawnMax: 34,
    skill: 'woodcutting',
  },
};

export const playerColor = '#00ffab';
