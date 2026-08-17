export class EntityPool {
  constructor(create) {
    this.create = create;
    this.items = [];
  }

  acquire(...args) {
    const item = this.items.find((candidate) => !candidate.active) ?? this.create();
    if (!this.items.includes(item)) this.items.push(item);
    item.reset(...args);
    return item;
  }

  forEachActive(callback) {
    for (const item of this.items) {
      if (item.active) callback(item);
    }
  }

  get activeItems() {
    return this.items.filter((item) => item.active);
  }

  countActive() {
    return this.items.reduce((count, item) => count + (item.active ? 1 : 0), 0);
  }

  deactivateAll() {
    for (const item of this.items) item.active = false;
  }
}
