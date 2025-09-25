import { Entity } from './entity.js';
import { clamp } from './utils.js';

const DIRECTIONS = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 }
};

export class Player extends Entity {
  constructor(world, items) {
    super({ x: world.spawn.x, y: world.spawn.y });
    this.world = world;
    this.items = items;
    this.inventory = [];
    this.actionCooldown = 0;
    this.maxInventory = 28;
  }

  update(input) {
    if (this.actionCooldown > 0) {
      this.actionCooldown -= 1;
    }

    const direction = this.resolveDirection(input);
    if (direction) {
      this.tryMove(direction.dx, direction.dy);
    }

    return input.action && this.actionCooldown === 0;
  }

  resolveDirection(input) {
    if (input.up) return DIRECTIONS.up;
    if (input.down) return DIRECTIONS.down;
    if (input.left) return DIRECTIONS.left;
    if (input.right) return DIRECTIONS.right;
    return null;
  }

  tryMove(dx, dy) {
    const targetX = clamp(this.x + dx, 0, this.world.width - 1);
    const targetY = clamp(this.y + dy, 0, this.world.height - 1);
    if (this.world.isBlocked(targetX, targetY)) return false;
    this.move(targetX - this.x, targetY - this.y);
    return true;
  }

  addItem(itemId) {
    if (this.inventory.length >= this.maxInventory) {
      return false;
    }
    this.inventory.push(itemId);
    return true;
  }

  setCooldown(ticks) {
    this.actionCooldown = ticks;
  }
}
