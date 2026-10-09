(() => {
  'use strict';
  const KEY = 'pazneria.room-handoff.v1';
  const destinations = {
    arcade: '/arcade/',
    lab: '/lab/lab-space/',
    library: '/library/',
  };
  let record;
  try {
    record = JSON.parse(window.sessionStorage.getItem(KEY));
    window.sessionStorage.removeItem(KEY);
  } catch { return; }
  if (!record || record.version !== 1 || record.camera !== 'default-entry-v1') return;
  if (!Number.isFinite(record.createdAt) || record.createdAt > Date.now() || Date.now() - record.createdAt > 15000) return;
  if (!Object.hasOwn(destinations, record.room) || record.path !== destinations[record.room] || window.location.pathname !== record.path) return;
  let image;
  try { image = new URL(record.image, window.location.href); } catch { return; }
  const allowedImage = '/assets/images/rooms/' + record.room + '-entry.jpg';
  if (image.origin !== window.location.origin || image.pathname !== allowedImage || image.search || image.hash || image.username || image.password) return;

  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const forced = window.matchMedia('(forced-colors: active)');
  if (forced.matches) return;
  let controls = null, timeout = null, fade = null, finished = false;
  const style = document.createElement('style');
  style.textContent =
    'html[data-room-handoff]::after{content:"";position:fixed;inset:0;z-index:2147480000;background:#101916 url("' + image.href + '") center/cover no-repeat;opacity:1;pointer-events:none;transition:opacity 160ms ease}' +
    'html[data-room-handoff="ready"]::after{opacity:0}' +
    '.pazneria-handoff-controls{position:fixed;z-index:2147480001;right:24px;bottom:24px;max-width:calc(100% - 48px);padding:12px;background:#101916;color:#f5f5f0;font:14px/1.5 system-ui,sans-serif}' +
    '.pazneria-handoff-controls a{display:inline-flex;align-items:center;min-height:44px;margin:4px;padding:8px 14px;border:1px solid currentColor;color:inherit;text-decoration:none}' +
    '.pazneria-handoff-status{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}' +
    '.pazneria-handoff-controls a:focus-visible{outline:3px solid currentColor;outline-offset:3px}' +
    '@media(prefers-reduced-motion:reduce){html[data-room-handoff]::after{transition:none}}';
  document.head.appendChild(style);
  root.dataset.roomHandoff = 'loading';

  function finish() {
    delete root.dataset.roomHandoff;
    controls?.remove();
    style.remove();
    window.clearTimeout(timeout);
    window.clearTimeout(fade);
    document.removeEventListener('keydown', escapeHome, true);
    forced.removeEventListener('change', accessibilityChange);
    reduced.removeEventListener('change', accessibilityChange);
    finished = true;
  }
  function ready() {
    if (finished) return;
    window.clearTimeout(timeout);
    controls?.remove();
    root.dataset.roomHandoff = 'ready';
    if (reduced.matches) finish();
    else fade = window.setTimeout(finish, 160);
  }
  function showControls(message = '') {
    if (finished || !document.body) return;
    controls?.remove();
    controls = document.createElement('div');
    controls.className = 'pazneria-handoff-controls';
    controls.setAttribute('role', 'dialog');
    controls.setAttribute('aria-modal', 'true');
    controls.setAttribute('aria-labelledby', 'pazneria-handoff-status');
    const status = document.createElement('p');
    status.id = 'pazneria-handoff-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.textContent = message || 'Opening ' + record.room + '.';
    if (!message) status.className = 'pazneria-handoff-status';
    const home = document.createElement('a');
    home.href = '/';
    home.textContent = 'Home / Cancel';
    controls.append(status, home);
    if (message) {
      const retry = document.createElement('a');
      retry.href = window.location.href;
      retry.textContent = 'Retry';
      controls.appendChild(retry);
    }
    document.body.appendChild(controls);
    if (!message) home.focus({ preventScroll: true });
  }
  function fail() {
    // Expose the destination's existing error/static fallback instead of trapping it.
    finish();
  }
  function escapeHome(event) {
    if (!finished && event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      window.location.assign('/');
    } else if (!finished && controls && event.key === 'Tab') {
      event.preventDefault();
      event.stopPropagation();
      const links = [...controls.querySelectorAll('a')];
      const current = links.indexOf(document.activeElement);
      const next = current < 0 ? 0 : (current + (event.shiftKey ? -1 : 1) + links.length) % links.length;
      links[next].focus({ preventScroll: true });
    }
  }
  function accessibilityChange() {
    if (forced.matches || (reduced.matches && root.dataset.roomHandoff === 'ready')) finish();
  }
  document.addEventListener('keydown', escapeHome, true);
  forced.addEventListener('change', accessibilityChange);
  reduced.addEventListener('change', accessibilityChange);
  window.pazneriaRoomHandoff = Object.freeze({ get active() { return !finished; }, room: record.room, camera: record.camera, ready, fail });
  const install = () => {
    if (finished) return;
    showControls();
    timeout = window.setTimeout(() => showControls('The room is still opening. You can retry or go home.'), 8000);
  };
  if (document.body) install();
  else document.addEventListener('DOMContentLoaded', install, { once: true });
  window.addEventListener('pagehide', finish, { once: true });
  window.addEventListener('pageshow', event => { if (event.persisted) finish(); });
})();
