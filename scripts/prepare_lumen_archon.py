from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'assets/astral-bloom/images/sprites/lumen_archon_source.png'
TARGET = ROOT / 'assets/astral-bloom/images/sprites/lumen_archon_game.png'


def is_magenta_artifact(red: int, green: int, blue: int) -> bool:
    return red > 145 and blue > 110 and green < 125 and (red + blue) > 330


image = Image.open(SOURCE).convert('RGBA')
pixels = image.load()
for y in range(image.height):
    for x in range(image.width):
        red, green, blue, alpha = pixels[x, y]
        if alpha == 0 or is_magenta_artifact(red, green, blue):
            pixels[x, y] = (red, green, blue, 0)

alpha = image.getchannel('A')
bbox = alpha.getbbox()
if bbox is None:
    raise RuntimeError('ボス画像に不透明な描画領域が見つかりません。')

left, top, right, bottom = bbox
padding = max(16, int(max(right - left, bottom - top) * 0.055))
left = max(0, left - padding)
top = max(0, top - padding)
right = min(image.width, right + padding)
bottom = min(image.height, bottom + padding)
image = image.crop((left, top, right, bottom))

canvas = Image.new('RGBA', (640, 512), (0, 0, 0, 0))
scale = min(canvas.width / image.width, canvas.height / image.height)
size = (max(1, round(image.width * scale)), max(1, round(image.height * scale)))
image = image.resize(size, Image.Resampling.LANCZOS)
offset = ((canvas.width - image.width) // 2, (canvas.height - image.height) // 2)
canvas.alpha_composite(image, offset)
canvas.save(TARGET, optimize=True)
print(f'created {TARGET.relative_to(ROOT)} size={canvas.size} bbox={canvas.getchannel("A").getbbox()}')
