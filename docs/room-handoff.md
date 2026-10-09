# Entry preview handoff v1

The homepage uses real, unmodified default-entry screenshots captured on
2026-10-09 at 1707 × 923, including the rooms' visible HUDs. Arcade and Lab came
from their published entries. The prepared Library refresh comes from locally
rendered draft Library PR7 at `5f81273b17a47438bdda50e244c4dbf921b14216`; its
publication remains pending. See `library-preview-refresh.md` for provenance.
No room engines run on the homepage. Portrait previews are a center crop and
cannot promise pixel-identical alignment with responsive destination cameras.

Publication needs the small bridges below. The homepage alone cannot retain an
image across a document replacement or remove the destinations' loading UI.

## Shared transport and early paint

Use same-tab, same-origin sessionStorage key `pazneria.room-handoff.v1`. The
homepage writes only for an explicit Enter link with a loaded preview:

```json
{
  "version": 1,
  "room": "arcade",
  "path": "/arcade/",
  "image": "https://pazneria.github.io/assets/images/rooms/arcade-entry.jpg",
  "camera": "default-entry-v1",
  "createdAt": 0,
  "viewport": { "width": 1707, "height": 923 }
}
```

`createdAt` is the actual millisecond timestamp. Reject records older than 15s,
future timestamps, wrong version, a room/path mismatch, or an image outside
the exact same-origin allowlist below. Remove the record immediately after
reading it. Storage denial is a normal direct-entry fallback.

| Repository | Path | Image | Matching entry |
| --- | --- | --- | --- |
| Pazneria/arcade | /arcade/ | /assets/images/rooms/arcade-entry.jpg | Default spawn facing the central machine |
| Pazneria/lab | /lab/lab-space/ | /assets/images/rooms/lab-entry.jpg | Default room view, prompt=01, Ivo camera ring |
| Pazneria/library | /library/ | /assets/images/rooms/library-entry.jpg | Default hearth-side entrance |

Each destination needs an early head bootstrap and fixed image overlay,
before its normal runtime script. Paint the captured image with `object-fit:
cover`, centered, above both canvas and HUD. Retain it while the actual room
loads; suppress the usual loading indicator only when a valid handoff is active.
Direct entries, invalid tokens, disabled JS and errors retain existing fallbacks.

The canonical implementation is supplied at `/assets/js/room-handoff.js`.
For publication, copy its exact source into an ordinary inline script immediately
after the destination's charset/viewport metadata, before external styles or
runtime scripts. Do not add `async`, `defer` or `type="module"`. This installs
the opaque image cover synchronously without another head-script download.
Keep a source comment naming the pinned homepage commit and canonical file.

A blocking external reference can be used for development, but its download
adds an early-paint dependency and cannot establish a no-flash handoff by itself:

```html
<script src="/assets/js/room-handoff.js"></script>
```

It validates/consumes the record, paints a fixed image through early head CSS,
provides Home/Cancel as soon as the body exists, starts its 8s retry timer from
the head, and exposes
`window.pazneriaRoomHandoff`. Missing/invalid records do nothing. Storage denial
and forced colors stay on the existing destination path. Direct header links,
new tabs and modified clicks do not create a record.

## Ready boundary and camera

The camera angles below are radians. All three use a vertical field of view of
70 degrees, centered capture framing, and current viewport aspect. These are
the actual default poses in the inspected source; bypass remembered inspection,
history, or character-return positions only during this valid incoming visit.

| Room | Matching pose | Projection |
| --- | --- | --- |
| Arcade | x=0, y/eye=1.62, z=-0.95; yaw=0, pitch=-0.04; crouch=false; Euler YXZ | vertical FOV=70; near=.03; far=40 |
| Lab | x=0, y/eye=1.62, z=7.3; yaw=0, pitch=-0.04; standing; Euler YXZ; default comparison prompt=01 | vertical FOV=70; near=.04; far=80; canvas client aspect |
| Library | player feet=(3.4,0,4.3), camera=(3.4,1.62,4.3); yaw=.78, pitch=.1; zero velocity; Euler YXZ; setView(0) then updatePlayer(0) | vertical FOV=70; near=.05; far=2500 |

Verified source commits and Git blob hashes:

| Repository / inspected commit | File | Git blob SHA |
| --- | --- | --- |
| Pazneria/arcade @ e72dc07f89f407d1a1d03fafb85b919c487950c6 | assets/arcade-app.js | e218561288b5d937d124d6422180cf27c62710ef |
| same | assets/arcade-motion.js | cf4e68313a6f7ecbf5feb7c9f2b370d5bf9c55e7 |
| same | assets/arcade-controller.js | efde7bf88f8d3c199e2360df11d279c500612073 |
| same | assets/arcade-scene.js | ba4a555c25e581b67307521703235adbe7d475bb |
| same | assets/arcade-loading.js | 8604c32c6612852d166233aec7d56850d2a81c6a |
| Pazneria/lab @ e05a3bf36b2ef6966379b50d949ce30a3ebe410a | lab-space/index.html | d601be1e97d19eff3d19edf6b0337b67b2a3955b |
| same | lab-space/assets/production-space.js | 2a8c51ac9e1baffd731157423fae9cef2055a9bd |
| same | lab-space/assets/production-navigation.mjs | d8d797fd61a766f6fdf855209cc34743e75a3469 |
| same | lab-space/assets/production-room.mjs | e385305c27eadb7706961cd2166d331fb7b92e50 |
| Pazneria/library @ 4a9b6aad25c2291470da9e9ad219472f3ae3d173 | src/main.js | 5e1bcb5f969fde28d03bffa6216c4203ecfd8e82 |
| same | src/loading.js | da7dd6f9cc2be7ebf2303dde6fc8fc495358d1ca |

The three JPEGs and their SHA256 hashes, byte sizes, capture source URLs and
dimensions are in `assets/images/rooms/entry-views.json` in the homepage repo.
Destination owners use that homepage-origin image path; do not duplicate or
regenerate the captures. They include the published room HUDs.

- Arcade: `assets/arcade-app.js` currently restores inspection state or calls
  `startExplore()` before `loading.finish()`. A valid handoff should use the
  default entry camera for that visit rather than a remembered cabinet close-up.
  Keep persistent preferences intact. Remove the overlay after
  essential scene assets and the first successful render at that camera.
  Do not use only “WebGL available” or “engine module imported” as ready.
- Lab: `lab-space/assets/production-space.js` has the existing `finishLoading()`
  boundary, called after `engine.draw()` and character readiness. For this
  handoff, use `spawn()` instead of restored history/character-return position
  and start at the captured default prompt=01 room camera,
  before remembered selection/movement can change it. Do not overwrite saved
  preferences. Reveal after the production room's essential assets and first
  frame, including Ivo and the room fixtures.
- Library: `src/main.js` ends initialization with `loadingScreen.ready()`.
  Use the current default hearth-side pose. Reveal after the essential
  scene is drawn successfully at that pose; retain its existing failure UI.

At the successful first matching frame, call
`window.pazneriaRoomHandoff?.ready()`. At the destination's existing failure
handler, call `window.pazneriaRoomHandoff?.fail()` so its normal error/static
fallback remains accessible. The shared bridge fades over 160ms, or removes the
cover immediately under reduced motion. Preserve existing input gating until
the ready boundary and move focus to the room's normal entry control when the
cover is removed. Do not mark ready at import or renderer construction.

Camera framing must match the current viewport. These captures match a desktop
aspect of 1707/923; resize/portrait uses a representative crop and a short fade,
not a claim of perfect alignment. If a room's entry camera or HUD changes,
replace its canonical capture and bump the camera/version contract together.

There is no browser-independent guarantee of uninterrupted pixels across two
documents. The inline bootstrap prevents an unthemed destination paint once
that document's head executes, and the already-visited image is normally cached,
but browser navigation, cache eviction and image decode timing remain outside
this bridge. The opaque backing prevents a light flash while the image arrives.
HUD layouts and ultrawide framing may also differ. Verify the combined flow on
the actual supported browsers before publishing; do not claim a universal
seamless transition from the homepage-only result.

## Failure, navigation and accessibility

Keep the preview during normal loading, with a visually hidden live status.
Provide an accessible Cancel/Home link throughout. On an initialization failure
or an 8s timeout, show Retry and Home with a useful error message; no silent
indefinite cover. Reuse the room's existing recoverable/static links.

Consume the record once; clear covers on pageshow/Back and release listeners on
pagehide. Modified clicks and new tabs have no handoff token and stay native.
Do not change permissions, credentials, site routing, quality budgets, controls,
or any persistent preference as part of this bridge.
