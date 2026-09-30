# Pazneria homepage

The public project index at https://pazneria.github.io/. This is a plain HTML/CSS
site, deployed by GitHub Pages from the root of the `main` branch. There is no
build step, package installation, client-side JavaScript, or framework.

## Layout

- `index.html`: content, navigation, metadata, and accessible landmarks.
- `assets/css/style.css`: typography, colors, responsive layout, focus styles,
  reduced motion, and forced-color support.
- `assets/images/mark.svg`: the J² favicon.
- `assets/images/racegpt-preview.jpg`: a real screenshot of the public RaceGPT
  build at https://pazneria.github.io/racegpt/?autoplay, captured on 2026-09-30.
- `assets/fonts/`: locally served Latin fonts and their SIL Open Font Licenses.
  Instrument Serif and DM Sans came from the official Google Fonts service.
  No font or third-party runtime requests are required by the homepage.

## Content and navigation

The Arcade is the primary live destination. The homepage also links directly to
RaceGPT, OSRS Clone, and Sword Guys. These games deploy from separate repositories
at `/racegpt/`, `/osrs-clone/`, and `/sword-guys/`; they are not nested under
`/arcade/`. Keep live links root-relative under the shared GitHub Pages hostname.

The benchmark tracker and voter intelligence entries are explicitly labeled
**In development**, with no public preview, capability claims, or private source
links. Their names and status are the only project information shown here.
School, Lab, and Blog currently have coming-soon pages; the homepage does not
present those pages as finished destinations.

Verify a project's public destination and status before adding a link. Published
sections and games stay in their own repositories; this homepage indexes them.

## Local preview

Open `index.html` directly, or serve this directory with an existing static
server. For example, with Python already installed:

```powershell
python -m http.server 5186 --bind 127.0.0.1
```

Visit http://127.0.0.1:5186/. Cross-repository root-relative links lead to local
paths during preview; test their published equivalents separately.

Before shipping, inspect desktop and narrow mobile viewports, confirm there is
no horizontal overflow, use Tab and Enter to check navigation and the skip link,
and verify public destination URLs. Essential navigation works without JavaScript.

## Deployment and contributions

Use pull requests for homepage changes so the history stays reviewable.
Merging to `main` publishes the root site through its existing GitHub Pages
branch deployment. Keep the navigation overview comment in `index.html`.
The redesign changes homepage files and adds static assets; it does not alter
deployment configuration or other project repositories.

## License

The bundled fonts use their included SIL Open Font Licenses. This repository
does not otherwise declare a project-wide license.
