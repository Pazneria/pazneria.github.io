(() => {
  'use strict';

  const HANDOFF_KEY = 'pazneria.room-handoff.v1';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const forcedColors = window.matchMedia('(forced-colors: active)');
  const root = document.documentElement;
  const rooms = [...document.querySelectorAll('[data-room].room-section')];
  const cover = document.querySelector('#entry-cover');
  const coverImage = document.querySelector('#entry-image');
  const status = document.querySelector('#entry-status');
  const recovery = document.querySelector('#entry-recovery');
  const retry = document.querySelector('#entry-retry');
  const cancel = document.querySelector('#entry-cancel');
  let frame = 0;
  let pending = null;

  const clamp = value => Math.max(0, Math.min(1, value));
  const loaded = image => image.complete && image.naturalWidth > 0;

  function paintJourney() {
    frame = 0;
    if (!root.classList.contains('js-journey')) return;
    const height = Math.max(1, window.innerHeight);
    const progress = rooms.map(room => clamp((height - room.getBoundingClientRect().top) / (height * .75)));
    let incoming = -1;
    for (let index = 0; index < progress.length; index++) {
      if (progress[index] > 0) incoming = index;
    }
    for (let index = 0; index < rooms.length; index++) {
      const view = rooms[index].querySelector('.room-view');
      const image = view.querySelector('img');
      const t = progress[index];
      let opacity = 0;
      if (index === incoming) opacity = loaded(image) ? t : 0;
      if (index === incoming - 1 && incoming >= 0) {
        const next = rooms[incoming].querySelector('img');
        opacity = loaded(image) && (loaded(next) || progress[incoming] < 1) ? 1 : 0;
      }
      view.style.opacity = String(opacity);
      image.style.setProperty('--room-zoom', String(1 + (index === incoming ? (1 - t) * .045 : 0)));
    }
    if (incoming >= 0) root.dataset.room = rooms[incoming].dataset.room;
    else delete root.dataset.room;
  }

  function schedulePaint() {
    if (!frame) frame = window.requestAnimationFrame(paintJourney);
  }

  function configureJourney() {
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
    root.classList.toggle('js-journey', !reducedMotion.matches && !forcedColors.matches);
    if (!root.classList.contains('js-journey')) {
      delete root.dataset.room;
      for (const room of rooms) {
        room.querySelector('.room-view').style.opacity = '';
        room.querySelector('img').style.removeProperty('--room-zoom');
      }
    } else schedulePaint();
  }

  function clearHandoff() {
    try { window.sessionStorage.removeItem(HANDOFF_KEY); } catch { /* Direct navigation remains usable. */ }
  }

  function resetNavigation(clear = true, restoreFocus = true) {
    if (pending) {
      window.clearTimeout(pending.timer);
      window.clearTimeout(pending.recoveryTimer);
      if (restoreFocus && pending.link.isConnected) pending.link.focus({ preventScroll: true });
    }
    pending = null;
    cover.hidden = true;
    recovery.hidden = true;
    document.body.classList.remove('is-opening');
    if (clear) clearHandoff();
    schedulePaint();
  }

  function writeHandoff(room, image, destination) {
    const record = {
      version: 1, room: room.dataset.room, path: destination.pathname,
      image: image.currentSrc || image.src, camera: 'default-entry-v1',
      createdAt: Date.now(), viewport: { width: window.innerWidth, height: window.innerHeight },
    };
    try { window.sessionStorage.setItem(HANDOFF_KEY, JSON.stringify(record)); } catch { /* Optional bridge only. */ }
  }

  function startVisit(link, room, image, destination, instant) {
    writeHandoff(room, image, destination);
    coverImage.src = image.currentSrc || image.src;
    status.textContent = 'Opening ' + room.querySelector('h2').textContent + '.';
    retry.href = destination.href;
    recovery.hidden = true;
    cover.hidden = false;
    pending = { link, timer: null, recoveryTimer: null, navigating: instant };
    if (!instant) {
      room.scrollIntoView({ block: 'start', behavior: 'smooth' });
      cancel.focus({ preventScroll: true });
      pending.timer = window.setTimeout(() => {
        if (!pending) return;
        pending.navigating = true;
        window.location.assign(destination.href);
      }, 320);
    }
    // A layout read starts the short alignment transition from the current view.
    cover.getBoundingClientRect();
    document.body.classList.add('is-opening');
    pending.recoveryTimer = window.setTimeout(() => {
      if (!pending) return;
      recovery.hidden = false;
      status.textContent = 'The room has not opened. Try again or cancel.';
    }, 8000);
  }

  document.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link) return;
    resetNavigation();
    if (!link.hasAttribute('data-transition') || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (link.hasAttribute('download') || (link.target && link.target !== '_self') || forcedColors.matches) return;
    const destination = new URL(link.href, window.location.href);
    const room = link.closest('.room-section');
    if (!room || destination.origin !== window.location.origin) return;
    const image = room.querySelector('img');
    if (!loaded(image)) return; // Never delay a visit behind a broken or unfinished preview.
    if (!reducedMotion.matches) event.preventDefault();
    startVisit(link, room, image, destination, reducedMotion.matches);
  });

  cancel.addEventListener('click', () => {
    window.scrollTo(0, window.scrollY);
    resetNavigation();
  });
  document.addEventListener('keydown', event => {
    if (!pending) return;
    if (event.key === 'Escape') {
      window.scrollTo(0, window.scrollY);
      resetNavigation();
    } else if (event.key === 'Tab') {
      event.preventDefault();
      const next = !recovery.hidden && document.activeElement === cancel ? retry : cancel;
      next.focus({ preventScroll: true });
    }
  });
  for (const type of ['auxclick', 'contextmenu']) {
    document.addEventListener(type, event => {
      if (event.target.closest('a')) resetNavigation();
    });
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && pending && !pending.navigating) resetNavigation(true, false);
  });
  window.addEventListener('pagehide', () => resetNavigation(false, false));
  window.addEventListener('pageshow', () => resetNavigation(true, false));
  window.addEventListener('scroll', schedulePaint, { passive: true });
  window.addEventListener('resize', schedulePaint, { passive: true });
  for (const room of rooms) {
    const image = room.querySelector('img');
    image.addEventListener('load', schedulePaint);
    image.addEventListener('error', () => {
      room.querySelector('.preview-fallback').hidden = false;
      schedulePaint();
    });
  }
  for (const preference of [reducedMotion, forcedColors]) {
    preference.addEventListener('change', () => {
      resetNavigation();
      configureJourney();
    });
  }
  configureJourney();
})();
