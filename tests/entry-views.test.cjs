const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { createHash } = require('node:crypto');
const manifest = JSON.parse(readFileSync(resolve(__dirname, '../assets/images/rooms/entry-views.json')));

test('entry metadata revisions match the room-specific transport contract', () => {
  assert.equal(manifest.version, 1);
  assert.equal(Object.hasOwn(manifest, 'camera'), false);
  assert.deepEqual(manifest.cameras, {"arcade":"default-entry-v1","lab":"default-entry-v2","library":"default-entry-v1"});
  assert.deepEqual(manifest.entries.map(e => e.room), ['arcade', 'lab', 'library']);
  for (const entry of manifest.entries) assert.equal(entry.camera, manifest.cameras[entry.room]);
});

test('Lab replacement is the exact owner-reviewed draft capture, never a live screenshot claim', () => {
  const entry = manifest.entries.find(e => e.room === 'lab');
  const image = readFileSync(resolve(__dirname, '..', entry.path));
  assert.equal(image.length, 170994); assert.equal(entry.bytes, image.length);
  assert.equal(createHash('sha256').update(image).digest('hex'), 'a2328ea468562b7827f2e9daaffec1edd7ac3b6990f3cac4c667e1ec5e0b263c');
  assert.equal(entry.sha256, 'a2328ea468562b7827f2e9daaffec1edd7ac3b6990f3cac4c667e1ec5e0b263c');
  assert.equal(entry.source_commit, 'e821df05d19e82cb46ad5eabd7c8401cf040919b');
  assert.equal(entry.publication_status, 'prepared-draft');
  assert.equal(entry.source_url, 'http://127.0.0.1:63325/lab/lab-space/?prompt=01&labqa=1');
  assert.equal(entry.intended_url, 'https://pazneria.github.io/lab/lab-space/?prompt=01');
  assert.equal(entry.capture_date, '2026-10-09'); assert.equal(entry.includes_room_hud, true);
  let dimensions = null;
  assert.equal(image.readUInt16BE(0), 0xffd8);
  for (let offset = 2; offset < image.length;) {
    assert.equal(image[offset++], 0xff); while (image[offset] === 0xff) offset++;
    const marker = image[offset++]; if (marker === 0xd9 || marker === 0xda) break;
    if (marker === 0x01 || marker >= 0xd0 && marker <= 0xd7) continue;
    const length = image.readUInt16BE(offset); assert.ok(length >= 2 && offset + length <= image.length);
    if ([0xc0, 0xc1, 0xc2].includes(marker)) { dimensions = { width: image.readUInt16BE(offset + 5), height: image.readUInt16BE(offset + 3) }; break; }
    offset += length;
  }
  assert.deepEqual(dimensions, { width: 1707, height: 923 });
  assert.equal(entry.width, dimensions.width); assert.equal(entry.height, dimensions.height);
});

test('Arcade and Library capture provenance remains unchanged', () => {
  const original = [{"room":"arcade","source_url":"https://pazneria.github.io/arcade/","capture_date":"2026-10-09","camera":"default-entry-v1","path":"assets/images/rooms/arcade-entry.jpg","width":1707,"height":923,"bytes":161170,"sha256":"4d27bc621aecfef0283b0233ec2413f403f330f489bcd71d731d86d697bc1dd7","includes_room_hud":true,"editing":"None; actual published entry screenshot"},{"room":"library","source_url":"https://pazneria.github.io/library/","capture_date":"2026-10-09","camera":"default-entry-v1","path":"assets/images/rooms/library-entry.jpg","width":1707,"height":923,"bytes":237295,"sha256":"d8892413d57035d3c8164eeb5325ef774316a76b1acf52ba608302ee609737b8","includes_room_hud":true,"editing":"None; actual published entry screenshot"}];
  assert.deepEqual(manifest.entries.filter(e => e.room !== 'lab'), original);
});
