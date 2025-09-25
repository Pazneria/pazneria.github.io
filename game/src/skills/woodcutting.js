import { roll } from '../utils.js';

export function registerWoodcutting({ player, world, ui, items }) {
  const logs = items.find((item) => item.id === 'logs');
  const message = (text) => ui.log(`[Woodcutting] ${text}`);

  return function attemptWoodcut(target) {
    if (!target || target.skill !== 'woodcutting') {
      message('There is nothing to chop.');
      return false;
    }

    const { level = 1, successRate = 75, respawnTicks = 6, yield: yieldId = 'logs', replacement } =
      target.definition.skillData ?? {};

    if (player.inventory.length >= player.maxInventory) {
      message('Your inventory is too full.');
      return false;
    }

    if (player.setCooldown) {
      player.setCooldown(respawnTicks);
    }

    if (roll(successRate)) {
      player.addItem(yieldId);
      const item = items.find((i) => i.id === yieldId) ?? logs;
      message(`You receive ${item?.name ?? yieldId}.`);
      target.state = 'stump';
      if (replacement) {
        world.replaceObject(target, replacement);
      } else {
        world.removeObject(target);
        target.resetAfter(respawnTicks * 600, (obj) => {
          world.objects.push(obj);
        });
      }
      return true;
    }

    message('You swing your axe, but fail to get any logs.');
    return false;
  };
}
