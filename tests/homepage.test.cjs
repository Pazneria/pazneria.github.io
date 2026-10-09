const assert = require('node:assert/strict');
const { test } = require('node:test');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { runInNewContext } = require('node:vm');

const script = readFileSync(resolve(__dirname, '../assets/js/homepage.js'), 'utf8');
const classList = () => {
  const names = new Set();
  return { add: (...items) => items.forEach(item => names.add(item)), remove: (...items) => items.forEach(item => names.delete(item)), contains: item => names.has(item) };
};
function eventTarget(extra = {}) {
  const handlers = new Map();
  return { ...extra, handlers, addEventListener(type, callback) { handlers.set(type, [...(handlers.get(type) || []), callback]); }, emit(type, event = {}) { for (const callback of handlers.get(type) || []) callback(event); } };
}
function setup({ reduced = false, forced = false, observation = true } = {}) {
  const motion = eventTarget({ matches: reduced });
  const colors = eventTarget({ matches: forced });
  const cards = Array.from({ length: 3 }, () => ({ classList: classList() }));
  const root = { classList: classList() };
  const document = eventTarget({ documentElement: root, hidden: false, querySelectorAll: () => cards });
  const timers = new Map();
  const navigations = [];
  const observers = [];
  let timerId = 0;
  const window = eventTarget({
    matchMedia: query => query.includes('reduced-motion') ? motion : colors,
    location: { href: 'https://pazneria.github.io/', origin: 'https://pazneria.github.io', assign: href => navigations.push(href) },
    setTimeout: (callback, delay) => { const id = ++timerId; timers.set(id, { callback, delay }); return id; },
    clearTimeout: id => timers.delete(id),
  });
  if (observation) window.IntersectionObserver = class {
    constructor(callback) { this.callback = callback; this.observed = new Set(); observers.push(this); }
    observe(card) { this.observed.add(card); }
    unobserve(card) { this.observed.delete(card); }
    disconnect() { this.observed.clear(); }
  };
  runInNewContext(script, { window, document, URL });
  const link = (index = 0, attrs = {}) => ({
    href: new URL(['/arcade/', '/lab/lab-space/', '/library/'][index], window.location.href).href,
    target: '', ...attrs,
    hasAttribute(name) { return name === 'data-transition' ? attrs.transition !== false : name === 'download' && !!attrs.download; },
    closest(selector) { return selector === 'a' ? this : selector === '[data-destination]' ? cards[index] : null; },
  });
  const click = (target = link(), extra = {}) => {
    const event = { target, button: 0, defaultPrevented: false, ...extra, preventDefault() { this.defaultPrevented = true; } };
    document.emit('click', event);
    return event;
  };
  const flush = () => { const pending = [...timers.values()]; timers.clear(); pending.forEach(timer => timer.callback()); };
  return { motion, colors, cards, root, document, window, timers, navigations, observers, link, click, flush };
}

test('a normal visit zooms briefly and navigates to each exact route', () => {
  for (const [index, route] of ['/arcade/', '/lab/lab-space/', '/library/'].entries()) {
    const app = setup();
    assert.equal(app.click(app.link(index)).defaultPrevented, true);
    assert.equal(app.cards[index].classList.contains('is-leaving'), true);
    assert.deepEqual(app.navigations, []);
    assert.equal([...app.timers.values()][0].delay, 180);
    app.flush();
    assert.deepEqual(app.navigations, ['https://pazneria.github.io' + route]);
  }
});

test('modified, middle, download, external, new-window and already-cancelled clicks remain native', () => {
  const variants = [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }, { defaultPrevented: true }];
  for (const extra of variants) {
    const app = setup();
    const event = app.click(app.link(), extra);
    assert.equal(event.defaultPrevented, !!extra.defaultPrevented);
    assert.equal(app.timers.size, 0);
  }
  for (const attrs of [{ download: true }, { target: '_blank' }, { href: 'https://example.com/' }, { transition: false }]) {
    const app = setup();
    assert.equal(app.click(app.link(0, attrs)).defaultPrevented, false);
    assert.equal(app.timers.size, 0);
  }
});

test('keyboard activation and touch-generated clicks use the same valid destination', () => {
  for (const extra of [{ detail: 0 }, { pointerType: 'touch' }]) {
    const app = setup();
    assert.equal(app.click(app.link(), extra).defaultPrevented, true);
    app.flush();
    assert.deepEqual(app.navigations, ['https://pazneria.github.io/arcade/']);
  }
});

test('Escape, page exit, backgrounding and Back restoration cancel a pending visit', () => {
  for (const action of ['escape', 'pagehide', 'hidden', 'pageshow']) {
    const app = setup();
    app.click();
    if (action === 'escape') app.document.emit('keydown', { key: 'Escape' });
    if (action === 'pagehide') app.window.emit('pagehide');
    if (action === 'hidden') { app.document.hidden = true; app.document.emit('visibilitychange'); }
    if (action === 'pageshow') app.window.emit('pageshow');
    app.flush();
    assert.deepEqual(app.navigations, []);
    assert.equal(app.cards[0].classList.contains('is-leaving'), false);
  }
  const app = setup();
  app.click(); app.flush(); app.window.emit('pageshow');
  assert.equal(app.cards[0].classList.contains('is-leaving'), false);
  const stopped = setup();
  stopped.click(); stopped.flush(); stopped.document.emit('keydown', { key: 'Escape' });
  assert.equal(stopped.cards[0].classList.contains('is-leaving'), false);
});

test('a later visit replaces the first; direct and new-tab activations cancel its timer', () => {
  const app = setup();
  app.click(); app.click(app.link(2)); app.flush();
  assert.deepEqual(app.navigations, ['https://pazneria.github.io/library/']);
  for (const type of ['direct', 'modified', 'auxclick', 'contextmenu']) {
    const next = setup(); next.click();
    if (type === 'direct') next.click(next.link(1, { transition: false }));
    if (type === 'modified') next.click(next.link(1), { metaKey: true });
    if (type === 'auxclick' || type === 'contextmenu') next.document.emit(type, { target: next.link() });
    next.flush();
    assert.deepEqual(next.navigations, []);
  }
});

test('reduced motion and forced colors bypass animation and observe live changes', () => {
  for (const mode of ['reduced', 'forced']) {
    const app = setup({ [mode]: true });
    assert.equal(app.root.classList.contains('js-reveal'), false);
    assert.equal(app.click().defaultPrevented, false);
    assert.equal(app.timers.size, 0);
  }
  for (const key of ['motion', 'colors']) {
    const app = setup(); app.click();
    app[key].matches = true; app[key].emit('change'); app.flush();
    assert.deepEqual(app.navigations, []);
    assert.equal(app.root.classList.contains('js-reveal'), false);
    assert.equal(app.observers[0].observed.size, 0);
    app[key].matches = false; app[key].emit('change');
    assert.equal(app.root.classList.contains('js-reveal'), true);
  }
});

test('viewport entry reveals once; keyboard focus reveals before waiting for observation', () => {
  const app = setup();
  assert.equal(app.observers[0].observed.size, 3);
  app.observers[0].callback([{ target: app.cards[0], isIntersecting: true }]);
  assert.equal(app.cards[0].classList.contains('is-visible'), true);
  assert.equal(app.observers[0].observed.size, 2);
  app.document.emit('focusin', { target: app.link(1) });
  assert.equal(app.cards[1].classList.contains('is-visible'), true);
  assert.equal(app.observers[0].observed.size, 1);
  const fallback = setup({ observation: false });
  assert.equal(fallback.root.classList.contains('js-reveal'), false);
  assert.equal(fallback.observers.length, 0);
});

test('no wheel, scroll or touch handlers hijack native scrolling', () => {
  const app = setup();
  for (const type of ['wheel', 'scroll', 'touchmove', 'touchstart']) {
    assert.equal(app.document.handlers.has(type), false);
    assert.equal(app.window.handlers.has(type), false);
  }
});
