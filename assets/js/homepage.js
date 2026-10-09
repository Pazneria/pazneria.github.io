(() => {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const forcedColors = window.matchMedia('(forced-colors: active)');
  const cards = [...document.querySelectorAll('[data-destination]')];
  let observer = null;
  let pendingNavigation = null;

  function resetNavigation() {
    if (!pendingNavigation) return;
    window.clearTimeout(pendingNavigation.timer);
    pendingNavigation.card.classList.remove('is-leaving');
    pendingNavigation = null;
  }

  function configureReveals() {
    observer?.disconnect();
    observer = null;
    document.documentElement.classList.remove('js-reveal');
    if (reducedMotion.matches || forcedColors.matches || !('IntersectionObserver' in window)) return;
    observer = new window.IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        observer?.unobserve(entry.target);
      }
    }, { threshold: 0.12 });
    for (const card of cards) {
      if (!card.classList.contains('is-visible')) observer.observe(card);
    }
    document.documentElement.classList.add('js-reveal');
  }

  document.addEventListener('focusin', (event) => {
    const card = event.target.closest('[data-destination]');
    if (!card) return;
    card.classList.add('is-visible');
    observer?.unobserve(card);
  });

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a');
    if (!link) return;
    // Another link activation cancels an earlier pending visit, including new tabs.
    resetNavigation();
    if (!link.hasAttribute('data-transition') || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
    if (reducedMotion.matches || forcedColors.matches) return;
    const destination = new URL(link.href, window.location.href);
    if (destination.origin !== window.location.origin) return;
    const card = link.closest('[data-destination]');
    if (!card) return;

    event.preventDefault();
    card.classList.add('is-visible', 'is-leaving');
    const timer = window.setTimeout(() => {
      // Keep cleanup state until page exit in case the browser stops navigation.
      // Ordinary cross-document navigation follows a brief local zoom.
      window.location.assign(destination.href);
    }, 180);
    pendingNavigation = { card, timer };
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') resetNavigation();
  });
  for (const type of ['auxclick', 'contextmenu']) {
    document.addEventListener(type, (event) => {
      if (event.target.closest('a')) resetNavigation();
    });
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) resetNavigation();
  });
  window.addEventListener('pagehide', resetNavigation);
  window.addEventListener('pageshow', () => {
    resetNavigation();
    for (const card of cards) card.classList.remove('is-leaving');
  });
  for (const preference of [reducedMotion, forcedColors]) {
    preference.addEventListener('change', () => {
      resetNavigation();
      configureReveals();
    });
  }
  configureReveals();
})();
