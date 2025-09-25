const DATA_PATHS = {
  items: './data/items.json',
  objects: './data/objects.json',
  npcs: './data/npcs.json',
  region: './data/maps/region_0_0.json'
};

export async function loadData() {
  const [items, objects, npcs, region] = await Promise.all([
    fetch(DATA_PATHS.items).then((r) => r.json()),
    fetch(DATA_PATHS.objects).then((r) => r.json()),
    fetch(DATA_PATHS.npcs).then((r) => r.json()),
    fetch(DATA_PATHS.region).then((r) => r.json())
  ]);

  return { items, objects, npcs, region };
}

export function roll(percent) {
  return Math.random() * 100 < percent;
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function manhattanDistance(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}
