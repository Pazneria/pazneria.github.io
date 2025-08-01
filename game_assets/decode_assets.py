#!/usr/bin/env python3
import os
import json
import base64

def main():
    """
    Decode the base64‑encoded asset library into individual PNG files.

    This script looks for an `assets_data.json` file in the same directory as
    itself (`game_assets`). If that file is not found (to save repository
    space, the large JSON may live outside `game_assets`), it will fall back
    to the `generated_assets/assets_data.json` located at the project root.
    The decoded images are written into a sibling `assets/` directory, grouped
    by category and asset name.
    """
    base_dir = os.path.dirname(os.path.realpath(__file__))
    # Primary location: game_assets/assets_data.json
    primary_path = os.path.join(base_dir, 'assets_data.json')
    fallback_path = os.path.join(base_dir, '..', 'generated_assets', 'assets_data.json')
    data_path = primary_path if os.path.exists(primary_path) else fallback_path
    if not os.path.exists(data_path):
        raise FileNotFoundError(
            f"Could not find assets_data.json in {primary_path} or fallback {fallback_path}"
        )
    with open(data_path, 'r') as f:
        data = json.load(f)
    output_dir = os.path.join(base_dir, 'assets')
    for category, items in data.items():
        for name, b64list in items.items():
            for idx, b64str in enumerate(b64list, start=1):
                dirpath = os.path.join(output_dir, category, name)
                os.makedirs(dirpath, exist_ok=True)
                filename = f"{name}_{idx}.png" if len(b64list) > 1 else f"{name}.png"
                filepath = os.path.join(dirpath, filename)
                with open(filepath, 'wb') as out_file:
                    out_file.write(base64.b64decode(b64str))
    print(f"Assets decoded to {output_dir}")

if __name__ == '__main__':
    main()