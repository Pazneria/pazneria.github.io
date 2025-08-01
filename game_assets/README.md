# Game Assets

This folder contains a base64‑encoded asset library for the Pazneria RPG.

## How it's organized

* `assets_data.json` – JSON file mapping categories (terrain, transitions, water, bridges, trees, ores, nature_objects, enemies, humanoids, demi_humans, buildings, components, furniture, market, containers, tools, weapons, armor, misc_objects) to individual asset names. Each asset holds one or more base64‑encoded PNG images. To save repository space you may leave this file out of `game_assets` entirely – the `decode_assets.py` script will automatically fall back to reading `generated_assets/assets_data.json` at the project root if `assets_data.json` is missing from this folder.

* `decode_assets.py` – Run this script to decode the assets into actual image files. It will create a hierarchical `assets/` directory tree where each category is subdivided by asset name. For example `assets/terrain/grass/grass_1.png`, etc.

* `chunks/` – Contains map chunk definitions. `custom_chunk_01.json` is a sample chunk created by the agent for testing.

## Adding new assets

To add new assets, add base64 strings to `assets_data.json` under the appropriate category and asset name. The decoding script uses the number of base64 strings to determine file names; if there is more than one string for a given asset name, the files will be suffixed with `_1`, `_2`, etc.

## Decoding the assets

From the repository root run:

```bash
python game_assets/decode_assets.py
```

This will populate a `game_assets/assets/` directory with all of the PNG files.

## Chunk files

Standardized chunk files live under `game_assets/chunks/`. They are JSON documents with the following basic structure:

```json
{
  "name": "chunk_name",
  "description": "human readable description",
  "tiles": [
    ["grass", "grass", "dirt", ...],
    ...
  ],
  "objects": [
    {"type": "tree_oak", "x": 5, "y": 3},
    ...
  ]
}
```

The `tiles` array contains a grid of terrain names referencing keys in `assets_data.json`. The `objects` array contains objects placed on the chunk with their type and tile coordinates.

The file `custom_chunk_01.json` is a simple 10×10 layout using generated assets. Feel free to add more chunks following this format.
