# Pazneria Hub

This repository hosts the root landing page for `pazneria.github.io`. It acts as a
command center that connects the four major domains of the Pazneria ecosystem:

- **Arcade** – games and interactive worlds published to `/arcade` and its
  sub-paths
- **School** – curricula, lessons, and research programs at `/school`
- **Lab** – experimental simulations and prototypes at `/lab`
- **Blog** – notes, articles, changelogs, and forecasts at `/blog`

Each section will eventually live in its own GitHub repository and be published
via GitHub Pages, but this hub ensures they feel like one cohesive site.

## Repository Layout

```
/               Root of the GitHub Pages site (index.html)
├─ assets/
│  └─ css/
│     └─ style.css  # Shared look & feel for the landing page
├─ index.html        # Landing page linking to each section
└─ README.md         # This documentation
```

The hub intentionally keeps its footprint small so that individual sections can
set their own build pipelines, tech stacks, and content systems without forcing
coupling.

## Multi-Repository Architecture

The overall system is designed as a constellation of GitHub repositories that
publish under a shared domain via GitHub Pages:

```
pazneria.github.io           (this repo – the hub)
├─ /arcade                   (GitHub Pages site published from pazneria/arcade)
│   ├─ /game-name            (individual game repos, e.g. pazneria/game-name)
│   └─ ...
├─ /school                   (pazneria/school repo)
├─ /lab                      (pazneria/lab repo)
└─ /blog                     (pazneria/blog repo)
```

- Each destination repo is responsible for building and deploying its own static
  site or SPA to the `/section-name` path.
- Games live inside their own repositories and are published beneath
  `/arcade/<game-name>`.
- The hub only needs to maintain consistent navigation and shared design cues so
  the user experience feels unified.

## How the Hub Connects to Other Repositories

- Navigation links in `index.html` use **root-relative paths** (`/arcade`,
  `/school`, `/lab`, `/blog`). Once the corresponding repositories are published
  with GitHub Pages, these paths resolve automatically.
- To add a new card or section, duplicate one of the existing `.section-card`
  blocks in the HTML, adjust the link (`href`), label, and description, and push
  the change.
- To add a new game under the Arcade, create a new GitHub repository (for
  example `pazneria/satellite-chess`), enable Pages for it (see below), and
  ensure its `index.html` is accessible at `/arcade/satellite-chess`. Then add a
  link to that game from the Arcade index (within the Arcade repo) and optionally
  reference it here under "Arcade highlights" or a featured area.

## Adding New Sections or Projects

1. **Create the repository** in the `pazneria` GitHub organization (or under
   your username) with a descriptive name.
2. **Build the content** using your preferred stack (vanilla HTML, Astro,
   Next.js static export, etc.). Ensure the build output is a static site.
3. **Configure GitHub Pages**:
   - Go to the repository settings → *Pages*.
   - Choose the branch (`main` by default) and the folder (`/` for root or
     `/docs` if you use a docs folder).
   - Save to enable deployment. GitHub will host the site at
     `https://pazneria.github.io/<repository-name>`.
   - For game repos, add the prefix `arcade-` or document the path so the link
     remains predictable (e.g. `pazneria.github.io/arcade/gravity-well`).
4. **Link from the hub**:
   - Update `index.html` with a new navigation card if it's a top-level section.
   - For Arcade games, update the Arcade repository to surface the new game and
     optionally add a featured link on the hub.
5. **Ensure a consistent look & feel** by sharing design tokens (colors, fonts,
   icons) defined in `assets/css/style.css`, or import the stylesheet into other
   repos if desired.

## GitHub Pages Setup

### Hub (this repository)

1. Push the repository to GitHub with the default branch `main`.
2. In repository settings → *Pages*, select `Deploy from a branch`.
3. Choose `main` as the branch and `/ (root)` as the folder, then save.
4. GitHub Pages will publish the site at `https://pazneria.github.io` (or
   `https://<your-username>.github.io`).

### Section Repositories (School, Lab, Blog, Arcade, Games)

For each additional repository:

1. Structure the project as a static site (build outputs to plain HTML/CSS/JS).
2. Enable GitHub Pages (branch + folder) so it publishes to
   `https://pazneria.github.io/<project-name>`.
3. If you require a custom build step (React, Vue, etc.), configure GitHub
   Actions or another CI workflow to build and push the static output to the
   Pages branch.
4. Test the deployed URL and confirm it matches the path used in this hub.

## Working with AI Agents & Collaborators

- Keep navigation comments in `index.html` intact; they explain how routing
  between repositories works.
- Document any new section in the relevant repo and update this README if the
  architecture changes (for example, adding a new top-level section).
- When contributing, use pull requests even for static changes so the history of
  the hub remains easy to audit.

## Local Development

This is a static site, so you can open `index.html` directly in a browser. To
run a local server for live reload, use any static server (e.g. `npx serve`).

```bash
npx serve .
```

## License

Specify a license once the broader project has one (e.g. MIT). Until then, this
repository remains proprietary by default.
