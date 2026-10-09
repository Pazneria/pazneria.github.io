# Entry preview handoff v1

The homepage uses real, unmodified screenshots of the published default entry
views, captured on 2026-10-09 at 1707 × 923. They include the rooms' visible HUDs.
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

The shared implementation is supplied at `/assets/js/room-handoff.js`. Add this
blocking script in each destination's head, before its runtime:

```html
<script src="/assets/js/room-handoff.js"></script>
```

It validates/consumes the record, paints a fixed image through early head CSS,
provides Home/Cancel and an 8s retry fallback, and exposes
`window.pazneriaRoomHandoff`. Missing/invalid records do nothing. Storage denial
and forced colors stay on the existing destination path. Direct header links,
new tabs and modified clicks do not create a record.

## Ready boundary and camera

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

## Failure, navigation and accessibility

Keep the preview during normal loading, with a visually hidden live status.
Provide an accessible Cancel/Home link throughout. On an initialization failure
or an 8s timeout, show Retry and Home with a useful error message; no silent
indefinite cover. Reuse the room's existing recoverable/static links.

Consume the record once; clear covers on pageshow/Back and release listeners on
pagehide. Modified clicks and new tabs have no handoff token and stay native.
Do not change permissions, credentials, site routing, quality budgets, controls,
or any persistent preference as part of this bridge.
