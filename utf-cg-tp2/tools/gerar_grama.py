"""Gera a textura simples do gramado; requer Pillow apenas para regenerá-la."""
from pathlib import Path
from random import Random
from PIL import Image, ImageDraw, ImageFilter

aleatorio = Random(572)
tamanho = 512
imagem = Image.new("RGB", (tamanho, tamanho), (83, 119, 56))
desenho = ImageDraw.Draw(imagem)

# Manchas suaves e pequenos traços sugerem relva sem usar imagens externas.
for _ in range(2200):
    x, y = aleatorio.randrange(tamanho), aleatorio.randrange(tamanho)
    tom = aleatorio.randrange(-20, 21)
    cor = (max(0, 83 + tom), max(0, 119 + tom), max(0, 56 + tom // 2))
    raio = aleatorio.randrange(2, 8)
    desenho.ellipse((x - raio, y - raio, x + raio, y + raio), fill=cor)

imagem = imagem.filter(ImageFilter.GaussianBlur(1.2))
desenho = ImageDraw.Draw(imagem)
for _ in range(5500):
    x, y = aleatorio.randrange(tamanho), aleatorio.randrange(tamanho)
    tom = aleatorio.randrange(-25, 28)
    cor = (max(0, 92 + tom), max(0, 128 + tom), max(0, 56 + tom // 2))
    desenho.line((x, y, x + aleatorio.randrange(-2, 3), y - aleatorio.randrange(2, 7)), fill=cor)

destino = Path(__file__).resolve().parents[1] / "assets" / "textures" / "grama.png"
imagem.save(destino, optimize=True)
print(f"Textura gerada: {destino}")
