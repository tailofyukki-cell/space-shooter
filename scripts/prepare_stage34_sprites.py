from pathlib import Path
from PIL import Image

ROOT = Path('/home/ubuntu/space-shooter-engine/assets/astral-bloom/images/sprites')
SPECS = {
    'tessa_reave_source.png': ('tessa_reave_game.png', (416, 320)),
    'nox_reave_source.png': ('nox_reave_game.png', (432, 336)),
    'aurea_eclipse_source.png': ('aurea_eclipse_game.png', (704, 544)),
    'garden_heart_source.png': ('garden_heart_game.png', (768, 608)),
}


def is_temporary_key_color(red: int, green: int, blue: int) -> bool:
    return red > 130 and blue > 115 and green < 125 and red + blue > green * 3.1


def is_black_edge_background(red: int, green: int, blue: int, alpha: int, x: int, y: int, width: int, height: int) -> bool:
    if alpha < 28:
        return True
    edge = min(x, y, width - 1 - x, height - 1 - y)
    return edge < 24 and red < 11 and green < 11 and blue < 14


def prepare(source_name: str, target_name: str, target_size: tuple[int, int]) -> None:
    source = Image.open(ROOT / source_name).convert('RGBA')
    pixels = source.load()
    width, height = source.size
    for y in range(height):
        for x in range(width):
            red, green, blue, alpha = pixels[x, y]
            if is_temporary_key_color(red, green, blue) or is_black_edge_background(red, green, blue, alpha, x, y, width, height):
                pixels[x, y] = (red, green, blue, 0)
    alpha = source.getchannel('A')
    bbox = alpha.getbbox()
    if bbox is None:
        raise RuntimeError(f'No visible pixels remain in {source_name}')
    left, top, right, bottom = bbox
    padding = max(22, int(max(right - left, bottom - top) * 0.045))
    crop = source.crop((max(0, left - padding), max(0, top - padding), min(width, right + padding), min(height, bottom + padding)))
    crop.thumbnail(target_size, Image.Resampling.LANCZOS)
    canvas = Image.new('RGBA', target_size, (0, 0, 0, 0))
    canvas.alpha_composite(crop, ((target_size[0] - crop.width) // 2, (target_size[1] - crop.height) // 2))
    canvas.save(ROOT / target_name, optimize=True)
    print(f'{source_name} -> {target_name}: visible={sum(1 for value in canvas.getchannel("A").getdata() if value > 0)}')


for source_name, spec in SPECS.items():
    prepare(source_name, *spec)
