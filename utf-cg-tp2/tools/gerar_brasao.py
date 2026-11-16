"""Desenha uma versão estilizada das Asas da Liberdade para as bandeiras."""
from pathlib import Path
from random import Random
from PIL import Image, ImageDraw

tamanho = 512
imagem = Image.new("RGB", (tamanho, tamanho), (48, 78, 53))
d = ImageDraw.Draw(imagem)
rng = Random(104)
for _ in range(1800):
    x, y = rng.randrange(tamanho), rng.randrange(tamanho)
    tom = rng.randrange(-8, 9)
    d.line((x, y, x + rng.randrange(1, 8), y), fill=(48 + tom, 78 + tom, 53 + tom))

# Escudo claro e contorno escuro para manter o símbolo legível no tecido.
escudo = [(137, 85), (375, 85), (375, 295), (354, 349), (256, 415), (158, 349), (137, 295)]
d.polygon(escudo, fill=(27, 42, 34), outline=(218, 221, 204), width=9)
d.polygon([(149, 97), (363, 97), (363, 290), (342, 340), (256, 400), (170, 340), (149, 290)],
          fill=(119, 134, 125))

# Penas sobrepostas: uma asa azul e outra clara, com contornos escuros.
asas = [
    ([(254, 143), (166, 110), (183, 237), (238, 330), (278, 366), (263, 245)], (72, 119, 157)),
    ([(258, 143), (346, 110), (329, 237), (274, 330), (234, 366), (249, 245)], (230, 233, 222)),
]
for pontos, cor in asas:
    d.polygon(pontos, fill=cor, outline=(35, 49, 48), width=5)
for i in range(5):
    y = 145 + i * 24
    d.line([(174 + i * 5, y), (243 + i * 3, y + 33), (264, y + 69)],
           fill=(35, 49, 48), width=5)
    d.line([(338 - i * 5, y), (269 - i * 3, y + 33), (248, y + 69)],
           fill=(35, 49, 48), width=5)

destino = Path(__file__).resolve().parents[1] / "assets" / "textures" / "brasao.png"
imagem.save(destino, optimize=True)
print(f"Textura gerada: {destino}")
