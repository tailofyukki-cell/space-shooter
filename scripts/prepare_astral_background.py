from pathlib import Path
from PIL import Image

source = Path('/home/ubuntu/space-shooter-engine/assets/astral-bloom/images/backgrounds/stage01_glassrain_garden.png')
target = source.with_name('stage01_glassrain_garden_game.jpg')
image = Image.open(source).convert('RGB')
image.resize((1920, 1080), Image.Resampling.LANCZOS).save(target, 'JPEG', quality=88, optimize=True, progressive=True)
print(f'{target}\n{target.stat().st_size} bytes')
