const assert = require('node:assert/strict');
const { test } = require('node:test');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { runInNewContext } = require('node:vm');
const script = readFileSync(resolve(__dirname, '../assets/js/homepage.js'), 'utf8');
const KEY = 'pazneria.room-handoff.v1';
function classes() {
  const names = new Set();
  return { add: (...xs) => xs.forEach(x => names.add(x)), remove: (...xs) => xs.forEach(x => names.delete(x)), contains: x => names.has(x), toggle(x, value) { if (value) names.add(x); else names.delete(x); } };
}
function target(extra = {}) {
  const handlers = new Map();
  return { ...extra, handlers, addEventListener(type, callback, options) { handlers.set(type, [...(handlers.get(type) || []), { callback, options }]); }, emit(type, event = {}) { for (const h of handlers.get(type) || []) h.callback(event); } };
}
function setup({ reduced = false, forced = false, storage = true } = {}) {
  const motion = target({ matches: reduced }), colors = target({ matches: forced });
  const timers = new Map(), frames = new Map(), saved = new Map(), navigations = [];
  let id = 0, document, window;
  const element = extra => target({ classList: classes(), style: { setProperty(k, v) { this[k] = v; }, removeProperty(k) { delete this[k]; } }, hidden: true, focus() { document.activeElement = this; }, getBoundingClientRect: () => ({ top: 0 }), ...extra });
  const root = element({ dataset: {} });
  const cover = element(), coverImage = element(), status = element(), recovery = element(), retry = element(), cancel = element();
  const roomNames = ['arcade', 'lab', 'library'], titles = ['Arcade', 'Lab', 'Library'];
  const routes = ['/arcade/', '/lab/lab-space/', '/library/'];
  const rooms = roomNames.map((name, index) => {
    const image = element({ complete: true, naturalWidth: 1707, src: 'https://pazneria.github.io/assets/images/rooms/' + name + '-entry.jpg' });
    const view = element({ querySelector: () => image });
    const fallback = element();
    const room = element({
      dataset: { room: name }, image, view, fallback, top: 1000 + index * 1350,
      getBoundingClientRect() { return { top: this.top - window.scrollY }; },
      querySelector(selector) { return selector === '.room-view' ? view : selector === 'img' ? image : selector === 'h2' ? { textContent: titles[index] } : fallback; },
      scrollIntoView() { window.scrollY = this.top; window.emit('scroll'); },
    });
    return room;
  });
  const nodes = { '#entry-cover': cover, '#entry-image': coverImage, '#entry-status': status, '#entry-recovery': recovery, '#entry-retry': retry, '#entry-cancel': cancel };
  document = target({ documentElement: root, body: element(), hidden: false, querySelectorAll: () => rooms, querySelector: name => nodes[name] });
  window = target({
    innerHeight: 1000, innerWidth: 1707, scrollY: 0,
    matchMedia: q => q.includes('reduced-motion') ? motion : colors,
    location: { href: 'https://pazneria.github.io/', origin: 'https://pazneria.github.io', assign: href => navigations.push(href) },
    sessionStorage: { setItem(k, v) { if (!storage) throw Error('denied'); saved.set(k, v); }, removeItem(k) { if (!storage) throw Error('denied'); saved.delete(k); } },
    setTimeout(callback, delay) { const n = ++id; timers.set(n, { callback, delay }); return n; }, clearTimeout: n => timers.delete(n),
    requestAnimationFrame(callback) { const n = ++id; frames.set(n, callback); return n; }, cancelAnimationFrame: n => frames.delete(n),
    scrollTo(x, y) { window.scrollY = y; },
  });
  runInNewContext(script, { window, document, URL });
  const link = (index = 0, attrs = {}) => element({
    href: new URL(routes[index], window.location.href).href, target: '', isConnected: true, ...attrs,
    hasAttribute: name => name === 'data-transition' ? attrs.transition !== false : name === 'download' && !!attrs.download,
    closest(selector) { return selector === 'a' ? this : selector === '.room-section' ? rooms[index] : null; },
  });
  const click = (a = link(), extra = {}) => {
    const e = { target: a, button: 0, defaultPrevented: false, ...extra, preventDefault() { this.defaultPrevented = true; } };
    document.emit('click', e); return e;
  };
  const advance = delay => { const selected = [...timers].filter(([, t]) => t.delay === delay); selected.forEach(([n, t]) => { timers.delete(n); t.callback(); }); };
  const paint = () => { const selected = [...frames]; frames.clear(); selected.forEach(([, callback]) => callback()); };
  return { motion, colors, timers, frames, saved, navigations, root, rooms, document, window, cover, coverImage, recovery, retry, cancel, link, click, advance, paint };
}

test('each Enter aligns its actual preview, writes a bounded handoff and navigates once', () => {
  for (const [index, path] of ['/arcade/', '/lab/lab-space/', '/library/'].entries()) {
    const app = setup();
    assert.equal(app.click(app.link(index)).defaultPrevented, true);
    assert.equal(app.cover.hidden, false);
    assert.equal(app.coverImage.src, app.rooms[index].image.src);
    assert.equal(app.window.scrollY, app.rooms[index].top);
    const record = JSON.parse(app.saved.get(KEY));
    assert.equal(record.version, 1); assert.equal(record.path, path);
    assert.equal(record.room, app.rooms[index].dataset.room);
    assert.equal(record.camera, 'default-entry-v1');
    assert.equal(record.image, app.coverImage.src);
    assert.ok(Date.now() - record.createdAt < 1000);
    assert.equal(app.document.activeElement, app.cancel);
    assert.deepEqual(app.navigations, []);
    app.advance(320);
    assert.deepEqual(app.navigations, ['https://pazneria.github.io' + path]);
  }
});

test('modified, middle, new-tab, downloads, external and direct header links stay native', () => {
  for (const extra of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }, { defaultPrevented: true }]) {
    const app = setup(); const e = app.click(app.link(), extra);
    assert.equal(e.defaultPrevented, !!extra.defaultPrevented);
    assert.equal(app.saved.size, 0); assert.equal(app.timers.size, 0);
  }
  for (const attrs of [{ download: true }, { target: '_blank' }, { href: 'https://example.com/' }, { transition: false }]) {
    const app = setup();
    assert.equal(app.click(app.link(0, attrs)).defaultPrevented, false);
    assert.equal(app.saved.size, 0);
  }
});

test('keyboard and touch activation use the same accessible entry controller', () => {
  for (const extra of [{ detail: 0 }, { pointerType: 'touch' }]) {
    const app = setup(); app.click(app.link(), extra); app.advance(320);
    assert.deepEqual(app.navigations, ['https://pazneria.github.io/arcade/']);
  }
});

test('Cancel, Escape, backgrounding and a different link clear cover, timer and stale handoff', () => {
  for (const kind of ['cancel', 'escape', 'hidden', 'modified', 'auxclick', 'contextmenu']) {
    const app = setup(); app.click();
    if (kind === 'cancel') app.cancel.emit('click');
    if (kind === 'escape') app.document.emit('keydown', { key: 'Escape' });
    if (kind === 'hidden') { app.document.hidden = true; app.document.emit('visibilitychange'); }
    if (kind === 'modified') app.click(app.link(1), { metaKey: true });
    if (kind === 'auxclick' || kind === 'contextmenu') app.document.emit(kind, { target: app.link() });
    app.advance(320); app.advance(8000);
    assert.deepEqual(app.navigations, []); assert.equal(app.cover.hidden, true);
    assert.equal(app.saved.size, 0);
  }
});

test('page exit retains one destination record while Back resets the source cover', () => {
  const app = setup(); app.click(); app.advance(320);
  app.document.hidden = true; app.document.emit('visibilitychange');
  assert.equal(app.saved.size, 1);
  app.window.emit('pagehide');
  assert.equal(app.cover.hidden, true); assert.equal(app.saved.size, 1);
  app.window.emit('pageshow');
  assert.equal(app.saved.size, 0); assert.equal(app.document.body.classList.contains('is-opening'), false);
});

test('reduced motion keeps immediate native navigation; forced colors and missing images bypass covers', () => {
  const app = setup({ reduced: true });
  assert.equal(app.root.classList.contains('js-journey'), false);
  assert.equal(app.click().defaultPrevented, false);
  assert.equal([...app.timers.values()].some(t => t.delay === 320), false);
  assert.equal(app.saved.size, 1);
  const forced = setup({ forced: true });
  assert.equal(forced.click().defaultPrevented, false); assert.equal(forced.cover.hidden, true);
  for (const state of [{ complete: false }, { naturalWidth: 0 }]) {
    const failed = setup(); Object.assign(failed.rooms[0].image, state);
    assert.equal(failed.click().defaultPrevented, false); assert.equal(failed.saved.size, 0);
  }
});

test('live accessibility changes cancel motion and storage denial never blocks navigation', () => {
  for (const key of ['motion', 'colors']) {
    const app = setup(); app.click(); app[key].matches = true; app[key].emit('change');
    app.advance(320);
    assert.deepEqual(app.navigations, []);
    assert.equal(app.root.classList.contains('js-journey'), false);
    app[key].matches = false; app[key].emit('change');
    assert.equal(app.root.classList.contains('js-journey'), true);
  }
  const app = setup({ storage: false }); app.click(); app.advance(320);
  assert.deepEqual(app.navigations, ['https://pazneria.github.io/arcade/']);
});

test('slow or stopped navigation has retry, cancel and bounded keyboard focus without a spinner', () => {
  const app = setup(); app.click(); app.advance(320); app.advance(8000);
  assert.equal(app.recovery.hidden, false);
  assert.equal(app.retry.href, 'https://pazneria.github.io/arcade/');
  let prevented = false;
  app.document.emit('keydown', { key: 'Tab', preventDefault() { prevented = true; } });
  assert.equal(prevented, true); assert.equal(app.document.activeElement, app.retry);
  app.document.emit('keydown', { key: 'Escape' });
  assert.equal(app.cover.hidden, true); assert.equal(app.saved.size, 0);
});

test('native scroll samples at most one frame, blends real images and has no idle loop', () => {
  const app = setup(); app.paint();
  app.window.scrollY = app.rooms[1].top - 500;
  for (let i = 0; i < 20; i++) app.window.emit('scroll');
  assert.equal(app.frames.size, 1); app.paint(); assert.equal(app.frames.size, 0);
  assert.equal(app.root.dataset.room, 'lab');
  assert.equal(app.rooms[0].view.style.opacity, '1');
  assert.ok(Number(app.rooms[1].view.style.opacity) > 0 && Number(app.rooms[1].view.style.opacity) < 1);
  assert.equal(app.rooms[2].view.style.opacity, '0');
  assert.equal(app.window.handlers.get('scroll')[0].options.passive, true);
  for (const event of ['wheel', 'touchstart', 'touchmove']) {
    assert.equal(app.window.handlers.has(event), false); assert.equal(app.document.handlers.has(event), false);
  }
});

test('failed preview shows the direct-entry fallback instead of retaining the wrong room image', () => {
  const app = setup(); app.rooms[1].image.naturalWidth = 0; app.rooms[1].image.emit('error');
  app.window.scrollY = app.rooms[1].top; app.window.emit('scroll'); app.paint();
  assert.equal(app.rooms[1].fallback.hidden, false);
  assert.equal(app.rooms[0].view.style.opacity, '0');
  assert.equal(app.rooms[1].view.style.opacity, '0');
});
