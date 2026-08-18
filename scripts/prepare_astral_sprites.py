from pathlib import Path
from PIL import Image

ROOT = Path('/home/ubuntu/space-shooter-engine/assets/astral-bloom/images/sprites')
SPECS = {
    'player_cadenza7.png': ('player_cadenza7_game.png', (384, 240)),
    'enemy_pollen_scout.png': ('enemy_pollen_scout_game.png', (288, 216)),
    'enemy_petal_wisp.png': ('enemy_petal_wisp_game.png', (320, 256)),
    'enemy_crystal_gardener.png': ('enemy_crystal_gardener_game.png', (384, 320)),
    'boss_flora_orbis.png': ('boss_flora_orbis_game.png', (640, 512)),
}


def is_key_artifact(red, green, blue):
    vivid_magenta = red > 145 and blue > 120 and green < 105 and red + blue > green * 4
    vivid_green = green > 125 and green > red * 1.45 and green > blue * 1.12
    vivid_orange = red > 170 and green > 80 and green < 175 and blue < 85 and red > blue * 2
    return vivid_magenta or vivid_green or vivid_orange


for source_name, (target_name, target_size) in SPECS.items():
    source = Image.open(ROOT / source_name).convert('RGBA')
    pixels = source.load()
    width, height = source.size

    # Remove the deliberately chosen temporary chroma colors and any semitransparent fringe.
    for y in range(height):
        for x in range(width):
            red, green, blue, alpha = pixels[x, y]
            if alpha < 28 or is_key_artifact(red, green, blue):
                pixels[x, y] = (red, green, blue, 0)

    alpha = source.getchannel('A')
    bbox = alpha.getbbox()
    if bbox is None:
        raise RuntimeError(f'No visible pixels remain in {source_name}')

    left, top, right, bottom = bbox
    padding = max(18, int(max(right - left, bottom - top) * 0.06))
    crop = source.crop((
        max(0, left - padding),
        max(0, top - padding),
        min(width, right + padding),
        min(height, bottom + padding),
    ))
    crop.thumbnail(target_size, Image.Resampling.LANCZOS)

    canvas = Image.new('RGBA', target_size, (0, 0, 0, 0))
    offset = ((target_size[0] - crop.width) // 2, (target_size[1] - crop.height) // 2)
    canvas.alpha_composite(crop, offset)
    canvas.save(ROOT / target_name, optimize=True)
    print(f'{source_name} -> {target_name}: {crop.size} in {target_size}')
