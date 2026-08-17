from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
source = root / "build" / "app-icon.png"
image = Image.open(source).convert("RGBA")

icon = image.resize((512, 512), Image.Resampling.LANCZOS)
icon.save(root / "build" / "icon.png", format="PNG", optimize=True)
icon.save(
    root / "build" / "icon.ico",
    format="ICO",
    sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
)
print("Created build/icon.png and build/icon.ico")
