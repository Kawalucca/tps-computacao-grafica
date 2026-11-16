"""Gera texturas e modelos GLB estilizados originais (provisórios).
Requisitos SOMENTE para regenerar: pip install pillow numpy.
O site pronto não depende de Python nem dessas bibliotecas.
"""
from pathlib import Path
import math
import random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
TEX = ROOT / 'assets' / 'textures'
TEX.mkdir(parents=True, exist_ok=True)
rand = random.Random(728)

def ruido_textura(nome, base, variacao=35, caracteristicas='grain'):
    W=512
    arr = np.zeros((W,W,3), dtype=np.uint8)
    # Padrão de grãos de 8px, com variação local em cada pixel.
    grade = np.array([[rand.uniform(-1,1) for _ in range(65)] for _ in range(65)])
    for y in range(W):
        gy=y//8; fy=(y%8)/8
        for x in range(W):
            gx=x//8; fx=(x%8)/8
            n=(grade[gy,gx]*(1-fx)*(1-fy)+grade[gy+1,gx]*(1-fx)*fy+
               grade[gy,gx+1]*fx*(1-fy)+grade[gy+1,gx+1]*fx*fy)
            v=n*variacao + rand.randrange(-10,11)
            if caracteristicas=='wood':
                v+=math.sin(y*.38 + math.sin(x*.07)*3)*12
            if caracteristicas=='metal':
                v+=math.sin(y*.7)*3
            arr[y,x]=[max(0,min(255,int(c+v))) for c in base]
    img=Image.fromarray(arr,'RGB')
    d=ImageDraw.Draw(img,'RGBA')
    if caracteristicas=='stone':
        for _ in range(24):
            x=rand.randrange(W); y=rand.randrange(W)
            d.line((x,y,x+rand.randrange(-70,70),y+rand.randrange(-30,40)),fill=(20,19,19,55),width=rand.randrange(1,3))
    if caracteristicas=='grain':
        for _ in range(105):
            x=rand.randrange(W);y=rand.randrange(W);r=rand.randrange(1,5)
            d.ellipse((x-r,y-r,x+r,y+r),fill=(21,17,16,rand.randrange(25,75)))
    if caracteristicas=='wood':
        for _ in range(28):
            y=rand.randrange(W)
            d.line((0,y,W,y+rand.randrange(-8,8)),fill=(25,17,11,rand.randrange(30,85)),width=rand.randrange(1,3))
    img.save(TEX/f'{nome}.png',optimize=True)

ruido_textura('terra',[91,82,69],28,'grain')
ruido_textura('pedra',[111,111,107],26,'stone')
ruido_textura('madeira',[96,66,42],19,'wood')
ruido_textura('metal',[90,97,103],13,'metal')
ruido_textura('rocha',[61,68,74],24,'stone')

print('Texturas geradas em:', TEX)
