const LOG_LIMIT = 8;

export class UI {
  constructor({ inventoryEl, logEl, items }) {
    this.inventoryEl = inventoryEl;
    this.logEl = logEl;
    this.items = new Map(items.map((item) => [item.id, item]));
  }

  renderInventory(ids) {
    this.inventoryEl.innerHTML = '';
    if (!ids.length) {
      const li = document.createElement('li');
      li.textContent = 'Empty';
      li.classList.add('empty');
      this.inventoryEl.append(li);
      return;
    }

    ids.forEach((id) => {
      const li = document.createElement('li');
      const item = this.items.get(id);
      li.textContent = item ? item.name : id;
      this.inventoryEl.append(li);
    });
  }

  log(message) {
    const entry = document.createElement('li');
    entry.textContent = message;
    this.logEl.prepend(entry);
    while (this.logEl.children.length > LOG_LIMIT) {
      this.logEl.lastChild.remove();
    }
  }
}
