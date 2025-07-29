import { mapWidth, mapHeight, tickDuration } from './config.js';

export default class Camera {
  constructor(world, player) {
    this.world = world;
    this.player = player;
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.updateTarget();
    this.x = this.targetX;
    this.y = this.targetY;
    this.prevPlayerX = player.x;
    this.prevPlayerY = player.y;
  }

  // Clamp values so the camera does not show area outside the world
  clamp(x, y) {
    const maxX = this.world.width - mapWidth;
    const maxY = this.world.height - mapHeight;
    return {
      x: Math.max(0, Math.min(x, maxX)),
      y: Math.max(0, Math.min(y, maxY))
    };
  }

  updateTarget() {
    const halfW = Math.floor(mapWidth / 2);
    const halfH = Math.floor(mapHeight / 2);
    const { x, y } = this.clamp(this.player.x - halfW, this.player.y - halfH);
    this.targetX = x;
    this.targetY = y;
  }

  // Call once per tick after the player has moved
  checkPlayerMovement() {
    if (this.player.x !== this.prevPlayerX || this.player.y !== this.prevPlayerY) {
      this.updateTarget();
      this.prevPlayerX = this.player.x;
      this.prevPlayerY = this.player.y;
    }
  }

  update(deltaTime) {
    const step = deltaTime / tickDuration; // tiles per frame relative to 1 tile per tick
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    if (Math.abs(dx) > 0) {
      const moveX = Math.sign(dx) * Math.min(Math.abs(dx), step);
      this.x += moveX;
    }
    if (Math.abs(dy) > 0) {
      const moveY = Math.sign(dy) * Math.min(Math.abs(dy), step);
      this.y += moveY;
    }
  }
}
