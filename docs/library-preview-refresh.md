# Prepared Library entrance refresh

This image is a direct, unedited Playwright JPEG capture of the real built
Library PR7 at `5f81273b17a47438bdda50e244c4dbf921b14216`, captured locally before publication. Merge this image refresh
only after that exact approved Library runtime is deployed, so the homepage
preview and destination represent the same room. If the runtime changes, capture
the entrance again before publishing its preview.

The default-entry-v1 framing is 1707 x 923, DPR 1, vertical FOV 70, near .05,
far 2500, feet (3.4, 0, 4.3), camera (3.4, 1.62, 4.3), Euler YXZ yaw .78 and
pitch .1, zero velocity. Visible Controls and crosshair HUDs remain; the default
hint bar stays hidden. No crop, compositing, enhancement or CSS hiding was applied.
JPEG quality was 92. Byte size is 434951; SHA256 is
`ad96973832f16f525e3fd203602359a8e537bdfa6e50c9a22448dd6e1f9bded6`. The PNG evidence is retained separately in the QA handoff.

The local rendered check observed the actual head bootstrap consume the incoming
token, retain the image until the room had drawn 59 calls at the matching camera,
then remove the cover after its normal short fade. No capture or dialog was
restored. This verifies the destination bridge with an explicit same-origin test
token. Homepage mock-DOM tests verify its source-side write/alignment contract;
a full published cross-document homepage visit has not been tested for this draft.

The Library owner's supplied patch changes only its image and entry metadata,
alongside this provenance documentation. The combined homepage release also
adopts Arcade's separately approved capture. Lab image bytes and its manifest
entry, homepage theme/layout/scripts, and the canonical handoff bridge remain
unchanged. The temporary localhost capture server has been closed. Manifest
draft/publication-pending fields preserve capture-time provenance.

The previous Library JPEG was 237295 bytes; this image is
197,656 bytes larger. This is an image download cost,
not a homepage 3D runtime: no room engine is added to the homepage.
