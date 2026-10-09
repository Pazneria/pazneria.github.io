# Pazneria homepage

A lightweight public landing page at https://pazneria.github.io/. The page contains
the J² mark, Pazneria name, and navigation to usable public destinations.
There are no project descriptions, previews, roadmap, or coming-soon sections.

## Files

- `index.html`: content, navigation, metadata, and accessible landmarks.
- `assets/css/style.css`: colors, typography, responsive layout, focus styles,
  reduced-motion behavior, and forced-color support.
- `assets/js/homepage.js`: optional section reveals and brief visit transitions.
- `tests/homepage.test.cjs`: dependency-free CPU navigation behavior checks.
- `assets/images/mark.svg`: J² favicon.
- `assets/fonts/`: locally served DM Sans and Instrument Serif with their
  included SIL Open Font Licenses, from the official Google Fonts service.

The site is static HTML/CSS with a small JavaScript enhancement. It needs no
framework, package installation, or build step, and makes no external runtime
requests. All destinations remain ordinary links when JavaScript is disabled.

The homepage follows the browser's `prefers-color-scheme` preference, including
changes while the page is open. Light mode retains the paper and green palette;
dark mode uses a deep green canvas with pale green text and an inverted Arcade
card. Early color-scheme metadata and the render-blocking stylesheet apply the
preferred theme before first paint; native UI and browser theme colors follow
the same preference. The theme needs no JavaScript or stored preference.

Native scrolling leads from the J² hero to Arcade, Lab, and Library panels.
IntersectionObserver triggers a one-time lift and layered outline reveal; there
are no wheel handlers, scrolling animation loops, or hidden live scenes. Header
links go directly to each destination. A panel's Visit link gives a 180ms local
zoom before normal navigation; this does not provide a seamless transition into
another document. Modified clicks, new tabs, downloads, and external links keep
native behavior. Escape, another link activation, backgrounding, and page exit
cancel a pending visit. Back restores the panel without a lingering zoom.

Reduced motion and forced colors disable reveals and delayed navigation,
including preference changes while open. Keyboard focus reveals its panel
immediately. Touch and keyboard activation use the same links, and text remains
readable before reveal. The earlier compact homepage with automatic light/dark
mode is preserved at commit `88195c40542ec76e06059d49a8c92a24f3606604`.

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
node --test tests/homepage.test.cjs
```

## Deployment

Existing GitHub Pages deployment serves `main` from `/`. Use a pull request for
homepage changes. Keep the navigation overview comment in `index.html`.
Homepage changes should not modify Arcade, game, or Lab repositories.
There is no deployment configuration change.

## License

Bundled fonts use their included SIL Open Font Licenses. This repository does
not otherwise declare a project-wide license.
