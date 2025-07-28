// Shared configuration constants for the Pazneria RPG.
// The tile size and map dimensions define the grid on which
// the world and player operate. Colors are provided as
// hex strings for easy use with the Canvas API.

export const tileSize = 32;
export const mapWidth = 20;
export const mapHeight = 15;

// Pixels the player moves per animation frame. Adjust to
// change walking speed. Larger values result in faster movement.
export const walkSpeed = 4;

// Base background colour of the canvas. Matches the site's
// neon/cyberpunk aesthetic.
export const backgroundColor = '#0b0f27';

// Colours used for resource tiles. Each entry corresponds to a
// resource type spawned in the world.
export const resourceColors = {
  ore: '#8888aa',
  scrap: '#aa8844'
};

// Default tile colour for empty tiles. Slightly darker than
// resource tiles to create contrast.
export const defaultTileColor = '#1a253a';

// Colour used to render the player on the canvas.
export const playerColor = '#00ffab';
