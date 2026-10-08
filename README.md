# Pazneria homepage

A minimal public landing page at https://pazneria.github.io/. The page contains
the J² mark, Pazneria name, and navigation to usable public destinations.
There are no project descriptions, previews, roadmap, or coming-soon sections.

## Files

- `index.html`: content, navigation, metadata, and accessible landmarks.
- `assets/css/style.css`: colors, typography, responsive layout, focus styles,
  reduced-motion behavior, and forced-color support.
- `assets/images/mark.svg`: J² favicon.
- `assets/fonts/`: locally served DM Sans and Instrument Serif with their
  included SIL Open Font Licenses, from the official Google Fonts service.

The site is static HTML/CSS with no JavaScript, framework, package installation,
or build step. It makes no external runtime requests.

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

## Deployment

Existing GitHub Pages deployment serves `main` from `/`. Use a pull request for
homepage changes. Keep the navigation overview comment in `index.html`.
Homepage changes should not modify Arcade, game, or Lab repositories.
There is no deployment configuration change.

## License

Bundled fonts use their included SIL Open Font Licenses. This repository does
not otherwise declare a project-wide license.
