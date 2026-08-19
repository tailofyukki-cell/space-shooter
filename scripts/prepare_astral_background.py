from pathlib import Path
from PIL import Image

ROOT = Path('/home/ubuntu/space-shooter-engine')
BACKGROUND_SOURCES = (
    ('stage01_glassrain_garden.png', 'stage01_glassrain_garden_game.jpg'),
    ('stage02_moonrain_conduit_source.png', 'stage02_moonrain_conduit_game.jpg'),
    ('stage03_eclipse_canopy_source.png', 'stage03_eclipse_canopy_game.jpg'),
    ('stage04_astral_core_source.png', 'stage04_astral_core_game.jpg'),
)

for source_name, target_name in BACKGROUND_SOURCES:
    source = ROOT / 'assets/astral-bloom/images/backgrounds' / source_name
    target = source.with_name(target_name)
    if not source.exists():
        print(f'skip missing source: {source}')
        continue
    image = Image.open(source).convert('RGB')
    image.resize((1920, 1080), Image.Resampling.LANCZOS).save(
        target,
        'JPEG',
        quality=88,
        optimize=True,
        progressive=True,
    )
    print(f'created {target.relative_to(ROOT)} ({target.stat().st_size} bytes)')
