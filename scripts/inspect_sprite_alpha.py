from pathlib import Path
from PIL import Image

sprite_dir = Path('/home/ubuntu/space-shooter-engine/assets/astral-bloom/images/sprites')
for path in sorted(sprite_dir.glob('*.png')):
    image = Image.open(path).convert('RGBA')
    alpha = image.getchannel('A')
    bbox = alpha.getbbox()
    transparent = sum(1 for value in alpha.getdata() if value == 0)
    total = image.width * image.height
    print(f'{path.name}\tsize={image.width}x{image.height}\talpha_bbox={bbox}\ttransparent={transparent}/{total}')
