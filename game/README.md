# Pazneria Prototype Game

This directory contains the front-end only prototype for the Pazneria game. It mirrors the eventual project layout so you can plug in richer systems later without restructuring the site.

## Structure

```
src/          Core game modules (world, player, skills)
assets/       Placeholder for sprites, audio, fonts
data/         JSON definitions for items, objects, maps and NPCs
```

The prototype runs entirely in the browser. No build step or bundler is required; everything is native ES modules.

## Extending

* Flesh out `data/` to add more items, objects and map regions.
* Swap the drawing logic in `world.js` for sprite rendering once assets land in `assets/`.
* Replace the interval-based main loop with `requestAnimationFrame` when you need smoother movement.
* Expand `skills/` with additional skill handlers following the woodcutting example.
