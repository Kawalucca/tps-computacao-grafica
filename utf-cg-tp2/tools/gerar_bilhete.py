"""Gera a textura da folha de caderno encontrada atrás da muralha."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

imagem = Image.new("RGB", (512, 512), (241, 235, 214))
d = ImageDraw.Draw(imagem)
d.rectangle((3, 3, 508, 508), outline=(172, 162, 142), width=5)
for y in range(75, 512, 49):
    d.line((14, y, 498, y), fill=(167, 188, 190), width=2)
d.line((82, 8, 82, 503), fill=(193, 128, 121), width=3)
for y in (103, 255, 407):
    d.ellipse((25, y - 10, 45, y + 10), fill=(176, 169, 150))

try:
    fonte = ImageFont.truetype("segoeprb.ttf", 68)
except OSError:
    fonte = ImageFont.truetype("arial.ttf", 68)
texto = "TATAKAE"
caixa = d.textbbox((0, 0), texto, font=fonte, stroke_width=1)
x = 83 + (420 - (caixa[2] - caixa[0])) / 2
d.text((x, 208), texto, font=fonte, fill=(51, 45, 39), stroke_width=1)

destino = Path(__file__).resolve().parents[1] / "assets" / "textures" / "bilhete.png"
imagem.save(destino, optimize=True)
print(f"Textura gerada: {destino}")
