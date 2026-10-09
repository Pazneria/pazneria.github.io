# Pazneria homepage

A lightweight public landing page at https://pazneria.github.io/. Native scrolling
leads from the J² mark to real entry previews of Arcade, Lab, and Library.

## Files

- `index.html`: content, navigation, metadata, and accessible landmarks.
- `assets/css/style.css`: colors, typography, responsive layout, focus styles,
  reduced-motion behavior, and forced-color support.
- `assets/js/homepage.js`: optional image blending and brief entry alignment.
- `assets/js/room-handoff.js`: early destination cover and ready/failure API.
- `assets/images/rooms/`: untouched published entry captures and their provenance.
- `docs/room-handoff.md`: the small integration contract for destination owners.
- `tests/*.test.cjs`: dependency-free CPU navigation and bridge behavior checks.
- `assets/images/mark.svg`: J² favicon.
- `assets/fonts/`: locally served DM Sans and Instrument Serif with their
  included SIL Open Font Licenses, from the official Google Fonts service.

The site is static HTML/CSS with a small JavaScript enhancement. It needs no
framework, package installation, or build step, and makes no external runtime
requests. All destinations remain ordinary links when JavaScript is disabled.

The homepage follows the browser's `prefers-color-scheme` preference, including
changes while the page is open. Light mode retains the paper and green palette;
dark mode uses a deep green canvas with pale green text. Room captions use a
solid dark plate with high-contrast text over the actual authored imagery.
Early color-scheme metadata and the render-blocking stylesheet apply the
preferred theme before first paint; native UI and browser theme colors follow
the same preference. The theme needs no JavaScript or stored preference.

Three JPEG previews blend as their sections enter the viewport. A passive scroll
listener schedules at most one frame and does no work while idle. The homepage
runs no WebGL scene, intercepts no wheel/touch scrolling, and adds no dependency.
Without JavaScript, each preview and its ordinary link remain available.

An Enter link aligns the full-screen capture over 320ms and writes a short-lived,
same-tab handoff record before navigation. Escape, Cancel, another link and
backgrounding cancel a pending entry. A stalled visit exposes retry after 8s.
Back clears the cover. Header links, modified clicks and new tabs remain direct.
Broken or unfinished previews never delay navigation. Storage denial falls back
to normal destination loading.

The destination bridge consumes a valid record before first paint, keeps the
entry capture while that room loads, then fades it after a matching ready frame.
Publication requires the integrations in [the handoff contract](docs/room-handoff.md).
The homepage alone cannot hold an image across document replacement. Portrait
previews crop the real desktop captures; responsive cameras need a short fade
and cannot promise exact pixel alignment. No normal loading spinner is added.

Reduced motion uses static previews and immediate native entry. Forced colors
uses readable native-color text and links. Both preferences are followed live.
Keyboard and touch use the same links with visible focus and 44px-or-larger
targets. The earlier compact homepage with automatic light/dark mode is
preserved at commit `88195c40542ec76e06059d49a8c92a24f3606604`.

## Destinations

The section destinations are Arcade at `/arcade/`, Lab at `/lab/lab-space/`,
and Library at `/library/`.
Individual games are reached through the Arcade rather than homepage shortcuts.
Root-relative links preserve routing under the shared hostname. Lab has a
published benchmark discovery catalog; the homepage uses only its section name.

Library opens the separate optimized Hillside Library scene hosted from
`Pazneria/library`. Its source and production assets stay in that project repo;
the frozen Library benchmark remains in Lab. Verify the published scene and its
asset loading before merging the homepage link.

The Arcade entry renders its 3D scene on supported desktop and mobile browsers.
Coarse-pointer devices or widths below 768px use touch controls and a lower
rendering budget within the same `/arcade/` route.
The game directory remains available while the engine loads and when users
choose Games. It becomes the fallback when WebGL is unavailable, the engine
cannot load, or the 3D scene fails to initialize. With JavaScript disabled,
the entry provides a separate set of static game links.
The homepage does not override these decisions or modify the Arcade repository.

The public GitHub profile is linked in the footer. School and Blog are
excluded because their deployed pages contain only coming-soon placeholders.
Unpublished work is not advertised. Verify actual content before adding a
destination; HTTP 200 alone does not establish that a page is useful.

## Preview and verification

Open `index.html` directly, or use an existing static server. With Python:

```powershell
python -m http.server 5186 --bind 127.0.0.1
```

Visit http://127.0.0.1:5186/. Cross-repository links resolve to local paths in a
localhost preview; check their published equivalents separately.

Inspect desktop and narrow mobile widths, verify keyboard focus and skip-link
navigation, check text contrast and asset loading, and confirm destinations
contain usable content. The page remains usable without JavaScript.
Check light and dark browser preferences on initial load and switch preferences
while the page is open. Verify card and footer hover, keyboard focus, text
selection, reduced motion, and forced colors in both themes.
Check native scrolling, touch and keyboard visits, modified and middle clicks,
Escape cancellation, and browser Back after a visit. CPU checks need only Node:

```powershell
node --check assets/js/homepage.js
node --check assets/js/room-handoff.js
node --test tests/homepage.test.cjs tests/room-handoff.test.cjs
```

## Deployment

Existing GitHub Pages deployment serves `main` from `/`. Use a pull request for
homepage changes. Keep the navigation overview comment in `index.html`.
Homepage changes should not modify Arcade, game, or Lab repositories.
There is no deployment configuration change.

## License

Bundled fonts use their included SIL Open Font Licenses. This repository does
not otherwise declare a project-wide license.
