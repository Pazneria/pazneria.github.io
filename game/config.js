export const tileSize = 32;
export const mapWidth = 20;
export const mapHeight = 15;

// Game time is measured exclusively in ticks. 100 ticks per minute means
// one tick every 600ms.
export const ticksPerMinute = 100; // ticks per minute
export const tickRate = ticksPerMinute / 60; // ticks per second
export const tickDuration = 60000 / ticksPerMinute; // milliseconds per tick

export const backgroundColor = '#0b0f27';

export const defaultTileColor = '#1a253a';

export const resourceColors = {
  ore: '#8888aa',
  scrap: '#aa8844'
};

export const resourceDefinitions = {
  ore: {
    xpValue: 10,
    requiredTool: 'pickaxe',
    respawnMin: 17,
    respawnMax: 34,
    skill: 'mining',
  },
  scrap: {
    xpValue: 8,
    requiredTool: 'salvage_kit',
    respawnMin: 17,
    respawnMax: 34,
    skill: 'scavenging',
  },
};

export const playerColor = '#00ffab';

// Respawn time ranges for resources in ticks (ticksPerMinute = 100).
export const resourceRespawnTicks = {
  ore: {
    min: resourceDefinitions.ore.respawnMin,
    max: resourceDefinitions.ore.respawnMax,
  },
  scrap: {
    min: resourceDefinitions.scrap.respawnMin,
    max: resourceDefinitions.scrap.respawnMax,
  },
};
