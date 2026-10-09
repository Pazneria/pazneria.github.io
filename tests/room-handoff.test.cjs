const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { runInNewContext } = require('node:vm');
const source = readFileSync(resolve(__dirname, '../assets/js/room-handoff.js'), 'utf8');
function element() {
  return { children: [], dataset: {}, append(...xs) { this.children.push(...xs); }, appendChild(x) { this.children.push(x); }, setAttribute(k, v) { this[k] = v; }, remove() { this.removed = true; }, focus() { this.focused = true; }, querySelectorAll() { return this.children.filter(e => e.href); } };
}
function setup({ change = {}, path = '/arcade/', reduced = false, forced = false, denied = false, body = false } = {}) {
  const data = { version: 1, room: 'arcade', path: '/arcade/', image: 'https://pazneria.github.io/assets/images/rooms/arcade-entry.jpg', camera: 'default-entry-v1', createdAt: Date.now(), ...change };
  const events = new Map(), timers = new Map(), navigations = [];
  let consumed = false, id = 0;
  const preferences = new Map(), observers = [];
  const document = { documentElement: element(), head: element(), body: body ? element() : null, createElement: element,
    addEventListener(k, fn) { events.set(k, fn); }, removeEventListener(k) { events.delete(k); } };
  const window = {
    location: { origin: 'https://pazneria.github.io', pathname: path, href: 'https://pazneria.github.io' + path, assign: href => navigations.push(href) },
    sessionStorage: { getItem() { if (denied) throw Error('denied'); return JSON.stringify(data); }, removeItem() { consumed = true; } },
    matchMedia: q => {
      const preference = { matches: q.includes('reduced-motion') ? reduced : forced,
        addEventListener(k, fn) { this.change = fn; }, removeEventListener() { this.change = null; } };
      preferences.set(q, preference);
      return preference;
    },
    setTimeout(fn, delay) { const n = ++id; timers.set(n, { fn, delay }); return n; }, clearTimeout: n => timers.delete(n),
    addEventListener(k, fn) { events.set(k, fn); },
  };
  class MutationObserver {
    constructor(callback) { this.callback = callback; observers.push(this); }
    observe() { this.connected = true; }
    disconnect() { this.connected = false; }
  }
  runInNewContext(source, { window, document, URL, MutationObserver });
  const fire = delay => [...timers].filter(([, t]) => t.delay === delay).forEach(([n, t]) => { timers.delete(n); t.fn(); });
  return { window, document, timers, events, navigations, fire, preferences, observers, consumed: () => consumed };
}
test('valid handoff paints from the head before body and consumes its record once', () => {
  const app = setup();
  assert.equal(app.consumed(), true);
  assert.equal(app.document.body, null);
  assert.equal(app.document.documentElement.dataset.roomHandoff, 'loading');
  assert.ok(app.document.head.children[0].textContent.includes('/assets/images/rooms/arcade-entry.jpg'));
  app.document.body = element(); app.events.get('DOMContentLoaded')();
  assert.equal(app.document.body.children[0].children[1].textContent, 'Home / Cancel');
  assert.equal(app.document.body.children[0].children[1].href, '/');
});
test('slow deferred modules do not delay controls or the head-started recovery timer', () => {
  const app = setup();
  assert.equal([...app.timers.values()][0].delay, 8000);
  app.document.body = element();
  app.observers[0].callback();
  assert.equal(app.document.body.children[0].children[1].textContent, 'Home / Cancel');
  assert.equal(app.observers[0].connected, false);
  app.events.get('DOMContentLoaded')();
  assert.equal(app.document.body.children.length, 1);
  app.fire(8000);
  assert.equal(app.document.body.children.at(-1).children[2].textContent, 'Retry');
  const slowBody = setup(); slowBody.fire(8000);
  slowBody.document.body = element(); slowBody.observers[0].callback();
  assert.equal(slowBody.document.body.children[0].children[2].textContent, 'Retry');
  slowBody.window.pazneriaRoomHandoff.fail();
  assert.equal(slowBody.observers[0].connected, false);
});
test('stale, future, mismatched, cross-origin and modified image records are rejected', () => {
  for (const change of [{ createdAt: Date.now() - 16000 }, { createdAt: Date.now() + 10000 }, { version: 2 }, { room: '__proto__' }, { path: '/library/' }, { camera: 'other' }, { image: 'https://example.com/arcade.jpg' }, { image: 'https://pazneria.github.io/assets/images/rooms/lab-entry.jpg' }, { image: 'https://pazneria.github.io/assets/images/rooms/arcade-entry.jpg?x=1' }, { image: 'https://pazneria.github.io/assets/images/rooms/arcade-entry.jpg#x' }]) {
    const app = setup({ change });
    assert.equal(app.window.pazneriaRoomHandoff, undefined);
    assert.equal(app.document.head.children.length, 0);
    assert.equal(app.consumed(), true);
  }
  assert.equal(setup({ path: '/library/' }).window.pazneriaRoomHandoff, undefined);
  assert.equal(setup({ denied: true }).window.pazneriaRoomHandoff, undefined);
  assert.equal(setup({ forced: true }).window.pazneriaRoomHandoff, undefined);
});
test('matching first-frame ready fades briefly or removes immediately under reduced motion', () => {
  for (const reduced of [false, true]) {
    const app = setup({ reduced, body: true });
    app.window.pazneriaRoomHandoff.ready();
    if (!reduced) {
      assert.equal(app.document.documentElement.dataset.roomHandoff, 'ready');
      app.fire(160);
    }
    assert.equal(app.document.documentElement.dataset.roomHandoff, undefined);
    assert.equal(app.window.pazneriaRoomHandoff.active, false);
    assert.equal(app.timers.size, 0);
  }
});
test('timeout offers retry and home; failure and Back expose existing destination fallback', () => {
  const app = setup({ body: true }); app.fire(8000);
  const controls = app.document.body.children.at(-1);
  assert.ok(controls.children[0].textContent.includes('still opening'));
  assert.equal(controls.children[2].textContent, 'Retry');
  assert.equal(controls.children[2].href, app.window.location.href);
  app.window.pazneriaRoomHandoff.fail();
  assert.equal(app.document.documentElement.dataset.roomHandoff, undefined);
  assert.equal(controls.removed, true);
  const back = setup({ body: true }); back.events.get('pageshow')({ persisted: true });
  assert.equal(back.window.pazneriaRoomHandoff.active, false);
});
test('Escape cancels to Home only while a valid handoff is active', () => {
  const app = setup({ body: true });
  app.events.get('keydown')({ key: 'Escape', preventDefault() {}, stopPropagation() {} });
  assert.deepEqual(app.navigations, ['/']);
  app.window.pazneriaRoomHandoff.ready(); app.fire(160);
  assert.equal(app.events.has('keydown'), false);
});
test('loading cover keeps keyboard focus in visible controls and respects live accessibility changes', () => {
  const app = setup({ body: true });
  const controls = app.document.body.children.at(-1);
  assert.equal(controls.role, 'dialog');
  app.document.activeElement = controls.children[1];
  app.events.get('keydown')({ key: 'Tab', preventDefault() {}, stopPropagation() {} });
  assert.equal(controls.children[1].focused, true);
  app.fire(8000);
  const retryControls = app.document.body.children.at(-1);
  app.document.activeElement = retryControls.children[1];
  app.events.get('keydown')({ key: 'Tab', preventDefault() {}, stopPropagation() {} });
  assert.equal(retryControls.children[2].focused, true);
  app.document.activeElement = retryControls.children[1];
  app.events.get('keydown')({ key: 'Tab', shiftKey: true, preventDefault() {}, stopPropagation() {} });
  assert.equal(retryControls.children[2].focused, true);
  const forced = app.preferences.get('(forced-colors: active)');
  forced.matches = true; forced.change();
  assert.equal(app.window.pazneriaRoomHandoff.active, false);
  assert.equal(forced.change, null);
  const fading = setup({ body: true }); fading.window.pazneriaRoomHandoff.ready();
  const reduced = fading.preferences.get('(prefers-reduced-motion: reduce)');
  reduced.matches = true; reduced.change();
  assert.equal(fading.window.pazneriaRoomHandoff.active, false);
  assert.equal(fading.timers.size, 0);
});

test('camera revisions are room-specific: Lab v2 and unchanged Arcade/Library v1', () => {
  for (const [room, path, camera] of [['arcade', '/arcade/', 'default-entry-v1'], ['lab', '/lab/lab-space/', 'default-entry-v2'], ['library', '/library/', 'default-entry-v1']]) {
    const change = { room, path, camera, image: 'https://pazneria.github.io/assets/images/rooms/' + room + '-entry.jpg' };
    const valid = setup({ path, change });
    assert.equal(valid.window.pazneriaRoomHandoff?.active, true);
    assert.equal(valid.window.pazneriaRoomHandoff.camera, camera);
    valid.window.pazneriaRoomHandoff.fail();
    for (const wrongCamera of ['default-entry-v1', 'default-entry-v2', 'default-entry-v3', undefined]) {
      if (wrongCamera === camera) continue;
      const invalid = setup({ path, change: { ...change, camera: wrongCamera } });
      assert.equal(invalid.window.pazneriaRoomHandoff, undefined);
      assert.equal(invalid.document.head.children.length, 0);
      assert.equal(invalid.consumed(), true);
    }
  }
});
