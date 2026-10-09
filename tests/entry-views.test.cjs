const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { createHash } = require('node:crypto');
const manifest = JSON.parse(readFileSync(resolve(__dirname, '../assets/images/rooms/entry-views.json')));

function dimensions(image) {
  assert.equal(image.readUInt16BE(0), 0xffd8);
  for (let offset = 2; offset < image.length;) {
    assert.equal(image[offset++], 0xff); while (image[offset] === 0xff) offset++;
    const marker = image[offset++]; if (marker === 0xd9 || marker === 0xda) break;
    if (marker === 0x01 || marker >= 0xd0 && marker <= 0xd7) continue;
    const length = image.readUInt16BE(offset); assert.ok(length >= 2 && offset + length <= image.length);
    if ([0xc0, 0xc1, 0xc2].includes(marker)) return { width: image.readUInt16BE(offset + 5), height: image.readUInt16BE(offset + 3) };
    offset += length;
  }
  return null;
}

test('entry metadata revisions match the room-specific transport contract', () => {
  assert.equal(manifest.version, 1);
  assert.equal(Object.hasOwn(manifest, 'camera'), false);
  assert.deepEqual(manifest.cameras, {"arcade":"default-entry-v1","lab":"default-entry-v2","library":"default-entry-v1"});
  assert.deepEqual(manifest.entries.map(e => e.room), ['arcade', 'lab', 'library']);
  for (const entry of manifest.entries) assert.equal(entry.camera, manifest.cameras[entry.room]);
});

test('corrective Lab replacement is the exact owner-prepared PR65 capture, never a live screenshot claim', () => {
  const entry = manifest.entries.find(e => e.room === 'lab');
  const image = readFileSync(resolve(__dirname, '..', entry.path));
  assert.equal(image.length, 171898); assert.equal(entry.bytes, image.length);
  assert.equal(createHash('sha256').update(image).digest('hex'), '9379003c054b3daa59886b3b6b46d9c8999646388eeabc97b4ca460efd7cc17b');
  assert.equal(entry.sha256, '9379003c054b3daa59886b3b6b46d9c8999646388eeabc97b4ca460efd7cc17b');
  assert.equal(entry.source_commit, '05db8f5173d969a93babc5ead1329c96b5628ed6');
  assert.equal(entry.review_commit, '92e2d40dba3996fcbb2aeda3639910b0f9935828');
  assert.equal(entry.review_pr, 'https://github.com/Pazneria/lab/pull/65');
  assert.equal(entry.source_image_path, 'docs/previews/lab-physical-screen/lab-entry.jpg');
  assert.equal(entry.publication_status, 'prepared-draft');
  assert.equal(entry.source_url, 'https://github.com/Pazneria/lab/pull/65');
  assert.equal(entry.intended_url, 'https://pazneria.github.io/lab/lab-space/?prompt=01');
  assert.equal(entry.capture_date, '2026-10-09'); assert.equal(entry.includes_room_hud, true);
  const size = dimensions(image);
  assert.deepEqual(size, { width: 1707, height: 923 });
  assert.equal(entry.width, size.width); assert.equal(entry.height, size.height);
});

test('Arcade replacement is the exact PR48 candidate capture at the unchanged v1 camera', () => {
  const entry = manifest.entries.find(e => e.room === 'arcade');
  const image = readFileSync(resolve(__dirname, '..', entry.path));
  const hash = '8b6e1091eda5dc764dad4fde59c1601d6e6fbae5b94f7ef5cf4c5fb39aaa3a6b';
  assert.equal(image.length, 270048); assert.equal(entry.bytes, image.length);
  assert.equal(createHash('sha256').update(image).digest('hex'), hash); assert.equal(entry.sha256, hash);
  assert.deepEqual(dimensions(image), { width: 1707, height: 923 });
  assert.equal(entry.width, 1707); assert.equal(entry.height, 923);
  assert.equal(entry.camera, 'default-entry-v1');
  assert.equal(entry.source_repository, 'Pazneria/arcade');
  assert.equal(entry.source_commit, '461c5e7f917edb78854c3de8d38050a76bf4bbf0');
  assert.equal(entry.capture_date, '2026-10-09'); assert.equal(entry.includes_room_hud, true);
  assert.match(entry.editing, /unmodified candidate entry capture/);
  assert.match(entry.editing, /Coordinated publication pending/);
});

test('Library replacement is the exact owner-supplied PR7 capture at the unchanged v1 camera', () => {
  const original = {"room":"library","source_url":"https://pazneria.github.io/library/","capture_date":"2026-10-09","camera":"default-entry-v1","path":"assets/images/rooms/library-entry.jpg","width":1707,"height":923,"bytes":434951,"sha256":"ad96973832f16f525e3fd203602359a8e537bdfa6e50c9a22448dd6e1f9bded6","includes_room_hud":true,"editing":"None; actual local entry capture of the byte-identical published Library release","source_commit":"5f81273b17a47438bdda50e244c4dbf921b14216","source_status":"Published Library PR7; runtime bytes verified over HTTP","capture_url":"http://127.0.0.1:51215/library/","publish_commit":"7217dcc5cf88e413630324a7859a67ccb8db3e19","deployment_url":"https://github.com/Pazneria/library/actions/runs/37900515077"};
  const entry = manifest.entries.find(e => e.room === 'library');
  assert.deepEqual(entry, original);
  const image = readFileSync(resolve(__dirname, '..', entry.path));
  assert.equal(image.length, entry.bytes);
  assert.equal(createHash('sha256').update(image).digest('hex'), entry.sha256);
  assert.deepEqual(dimensions(image), { width: 1707, height: 923 });
});
