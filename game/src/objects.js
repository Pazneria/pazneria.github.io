export class WorldObject {
  constructor(id, definition, { x, y }) {
    this.id = id;
    this.definition = definition;
    this.x = x;
    this.y = y;
    this.state = 'default';
  }

  get isSolid() {
    return this.definition.solid ?? true;
  }

  get skill() {
    return this.definition.skill;
  }

  resetAfter(ms, callback) {
    setTimeout(() => {
      this.state = 'default';
      if (callback) callback(this);
    }, ms);
  }
}

export function instantiateObjects(objectPlacements, definitions) {
  const map = new Map(definitions.map((def) => [def.id, def]));
  return objectPlacements
    .map((placement) => {
      const definition = map.get(placement.id);
      if (!definition) return null;
      return new WorldObject(placement.id, definition, placement);
    })
    .filter(Boolean);
}
