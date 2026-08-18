from pathlib import Path
from PIL import Image

ROOT = Path('/home/ubuntu/space-shooter-engine/assets/astral-bloom/images/sprites')
SOURCE_DIR = ROOT / 'redesign'
SPECS = {
    'enemy_pollen_scout_source.png': ('enemy_pollen_scout_game.png', (288, 216)),
    'enemy_petal_wisp_source.png': ('enemy_petal_wisp_game.png', (320, 256)),
    'enemy_crystal_gardener_source.png': ('enemy_crystal_gardener_game.png', (384, 320)),
    'boss_flora_orbis_source.png': ('boss_flora_orbis_game.png', (640, 512)),
}


def is_temporary_key_color(red: int, green: int, blue: int) -> bool:
    vivid_magenta = red > 130 and blue > 115 and green < 125 and red + blue > green * 3.1
    vivid_green = green > 110 and green > red * 1.35 and green > blue * 1.08
    return vivid_magenta or vivid_green


def is_black_background(red: int, green: int, blue: int, alpha: int, x: int, y: int, width: int, height: int) -> bool:
    if alpha < 28:
        return True
    edge = min(x, y, width - 1 - x, height - 1 - y)
    return edge < 22 and red < 11 and green < 11 and blue < 14


def prepare(source_name: str, target_name: str, target_size: tuple[int, int]) -> None:
    source = Image.open(SOURCE_DIR / source_name).convert('RGBA')
    pixels = source.load()
    width, height = source.size

    for y in range(height):
        for x in range(width):
            red, green, blue, alpha = pixels[x, y]
            if is_temporary_key_color(red, green, blue) or is_black_background(red, green, blue, alpha, x, y, width, height):
                pixels[x, y] = (red, green, blue, 0)

    alpha = source.getchannel('A')
    bbox = alpha.getbbox()
    if bbox is None:
        raise RuntimeError(f'No visible pixels remain in {source_name}')

    left, top, right, bottom = bbox
    padding = max(22, int(max(right - left, bottom - top) * 0.045))
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
    visible = sum(1 for value in canvas.getchannel('A').getdata() if value > 0)
    print(f'{source_name} -> {target_name}: crop={crop.size}, visible_pixels={visible}')


for source_name, (target_name, target_size) in SPECS.items():
    prepare(source_name, target_name, target_size)
