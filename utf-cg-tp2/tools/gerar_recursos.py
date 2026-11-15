"""Gera texturas e modelos GLB estilizados originais (provisórios).
Requisitos SOMENTE para regenerar: pip install pillow numpy trimesh.
O site pronto não depende de Python nem dessas bibliotecas.
"""
from pathlib import Path
import math
import random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
import trimesh
from trimesh.visual.material import PBRMaterial

ROOT = Path(__file__).resolve().parents[1]
TEX = ROOT / 'assets' / 'textures'
MOD = ROOT / 'assets' / 'models'
TEX.mkdir(parents=True, exist_ok=True)
MOD.mkdir(parents=True, exist_ok=True)
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

# Cor em material PBR para preservar cada componente no carregador glTF.
def material(rgb, metal=0.0, rough=0.86):
    return PBRMaterial(baseColorFactor=[int(x) for x in rgb]+[255],
                       metallicFactor=metal, roughnessFactor=rough, doubleSided=True)

def novo_mesh(mesh, cor):
    mesh.visual=trimesh.visual.TextureVisuals(material=material(cor))
    return mesh

def add_mesh(scene, nome, mesh, cor, T=None):
    scene.add_geometry(novo_mesh(mesh,cor), node_name=nome,
                       geom_name=nome, transform=np.eye(4) if T is None else T)

def add_box(scene,nome,centro,tamanho,cor,rot_z=0):
    mesh=trimesh.creation.box(extents=tamanho)
    T=trimesh.transformations.translation_matrix(centro)
    if rot_z: T=T@trimesh.transformations.rotation_matrix(rot_z,[0,0,1])
    add_mesh(scene,nome,mesh,cor,T)

def add_ball(scene,nome,centro,escala,cor,subdiv=1):
    mesh=trimesh.creation.icosphere(subdivisions=subdiv,radius=1)
    T=trimesh.transformations.translation_matrix(centro)
    T=T@np.diag([escala[0],escala[1],escala[2],1.0])
    add_mesh(scene,nome,mesh,cor,T)

def add_tube(scene,nome,ini,fim,raio,cor,sec=9):
    a=np.asarray(ini,dtype=float);b=np.asarray(fim,dtype=float)
    vec=b-a
    mesh=trimesh.creation.cylinder(radius=raio,height=np.linalg.norm(vec),sections=sec)
    orient=trimesh.geometry.align_vectors([0,0,1],vec)
    T=trimesh.transformations.translation_matrix((a+b)/2)@orient
    add_mesh(scene,nome,mesh,cor,T)

# Levi: modelo estilizado de estudo, NÃO é o modelo oficial do personagem.
levi=trimesh.Scene()
preto=[29,29,34]; cinza=[39,44,47]; pele=[199,161,136]; verde=[38,78,63]
add_ball(levi,'corpo', [0,1.05,0], [0.31,0.46,0.22], [93,75,57])
add_box(levi,'jaqueta', [0,1.11,0.015],[0.59,0.60,0.37],[121,91,64])
add_box(levi,'camisa_clara', [0,1.18,0.21],[0.27,0.32,0.025],[193,179,154])
add_box(levi,'cinto', [0,0.76,0.02],[0.60,0.13,0.42],[72,66,49])
for lado,s in [('esq',-1),('dir',1)]:
    add_tube(levi,f'perna_{lado}',[s*.15,.76,0],[s*.18,.21,.18],.125,[49,48,49]);
    add_box(levi,f'bota_{lado}',[s*.18,.19,.25],[.22,.34,.41],preto)
    add_tube(levi,f'braco_{lado}',[s*.30,1.33,0],[s*.43,1.26,.44],.105,[110,86,63])
    add_ball(levi,f'luva_{lado}',[s*.43,1.26,.46],[.10,.12,.10],preto)
    add_box(levi,f'caixa_manobra_{lado}',[s*.42,.67,-.09],[.26,.27,.32],cinza)
    add_box(levi,f'correia_{lado}',[s*.20,.9,.22],[.075,.34,.05],[188,179,157],.15*s)
add_tube(levi,'pescoco',[0,1.40,0],[0,1.59,0],.11,pele)
add_ball(levi,'cabeca', [0,1.70,.03],[.23,.27,.21],pele,2)
add_ball(levi,'cabelo', [0,1.88,0],[.25,.15,.24],preto)
add_box(levi,'franja', [0,1.83,.18],[.46,.11,.09],preto)
for lado,s in [('esq',-1),('dir',1)]:
    add_ball(levi,f'olho_{lado}',[s*.088,1.72,.231],[.032,.026,.018],preto)
# Capa de patrulha, com aparência de duas abas esvoaçando para trás.
add_box(levi,'capa_ombros',[0,1.29,-.23],[.76,.16,.43],verde)
add_box(levi,'capa_esquerda',[-.21,1.08,-.38],[.39,.72,.11],[40,87,70],rot_z=-.15)
add_box(levi,'capa_direita',[.20,1.08,-.39],[.36,.69,.11],[33,73,59],rot_z=.24)
with open(MOD/'levi.glb','wb') as f: f.write(trimesh.exchange.gltf.export_glb(levi))

# Zeke - Titã Bestial estilizado, muito maior que Levi.
zeke=trimesh.Scene()
marrom=[97,67,45]; pelo=[114,79,51]; bege=[201,163,120]; sombra=[45,35,29]
add_ball(zeke,'torso_felpudo',[0,1.82,0],[.72,1.07,.55],marrom,2)
add_ball(zeke,'barriga',[0,1.42,.34],[.53,.55,.35],pelo,1)
add_box(zeke,'peitoral_claro',[0,2.06,.47],[.64,.55,.12],[147,108,73])
for lado,s in [('esq',-1),('dir',1)]:
    add_tube(zeke,f'braco_superior_{lado}',[s*.66,2.42,0],[s*1.13,1.58,.23],.24,marrom,11)
    add_tube(zeke,f'antebraco_{lado}',[s*1.13,1.58,.23],[s*1.30,.81,.42],.18,pelo,9)
    add_ball(zeke,f'mao_{lado}',[s*1.31,.78,.43],[.21,.24,.17],[89,65,48])
    add_tube(zeke,f'coxa_{lado}',[s*.34,1.05,0],[s*.42,.55,.16],.29,marrom)
    add_tube(zeke,f'perna_{lado}',[s*.42,.55,.16],[s*.45,.24,.28],.21,pelo)
    add_ball(zeke,f'pe_{lado}',[s*.46,.17,.40],[.23,.17,.35],[93,72,54])
    add_ball(zeke,f'ombro_pelo_{lado}',[s*.75,2.39,-.09],[.30,.31,.26],pelo)
add_tube(zeke,'pescoço',[0,2.55,0],[0,2.87,0],.30,marrom)
add_ball(zeke,'cabeca',[0,3.12,.07],[.43,.51,.36],bege,2)
add_ball(zeke,'cabelo_besta',[0,3.51,-.04],[.46,.23,.38],sombra)
add_ball(zeke,'barba',[0,2.91,.30],[.36,.22,.19],marrom)
add_ball(zeke,'focinho', [0,3.05,.42],[.25,.18,.14],bege)
add_box(zeke,'boca', [0,2.97,.56],[.24,.055,.025],[51,38,34])
for lado,s in [('esq',-1),('dir',1)]:
    add_ball(zeke,f'olho_{lado}',[s*.21,3.19,.382],[.047,.043,.021],[32,28,26],2)
    add_box(zeke,f'sobrancelha_{lado}',[s*.21,3.33,.39],[.18,.068,.07],marrom)
    for k in range(3):
        add_ball(zeke,f'pelos_{lado}_{k}',[s*(.45+k*.12),2.18-k*.18,.02],[.20,.26,.21],[115-k*9,84-k*6,55-k*3])
with open(MOD/'zeke.glb','wb') as f: f.write(trimesh.exchange.gltf.export_glb(zeke))

print('Gerados:')
for p in sorted([*TEX.glob('*.png'),*MOD.glob('*.glb')]):print(' ',p.relative_to(ROOT),p.stat().st_size)
