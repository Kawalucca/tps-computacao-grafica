"""Gera as malhas estáticas dos personagens em GLB 2.0, sem dependências.

As superfícies são compostas por anéis e triângulos, com normais interpoladas.
Executar a partir de qualquer pasta: py tools/gerar_personagens.py
"""
import json
import math
import struct
from pathlib import Path

DESTINO = Path(__file__).resolve().parents[1] / 'assets' / 'models'


def sub(a, b):
    return tuple(x-y for x, y in zip(a, b))


def cross(a, b):
    return (a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0])


def unit(v):
    length = math.sqrt(sum(x*x for x in v)) or 1
    return tuple(x/length for x in v)


class Modelo:
    def __init__(self):
        self.grupos = {}

    def malha(self, cor, pontos, faces):
        """Acumula normais por vértice, suavizando cada superfície."""
        normais = [[0., 0., 0.] for _ in pontos]
        for a, b, c in faces:
            n = cross(sub(pontos[b], pontos[a]), sub(pontos[c], pontos[a]))
            for i in (a, b, c):
                for k in range(3):
                    normais[i][k] += n[k]
        vertices, normals, indices = self.grupos.setdefault(cor, ([], [], []))
        offset = len(vertices)
        vertices.extend(pontos)
        normals.extend(unit(n) for n in normais)
        indices.extend(offset+i for face in faces for i in face)

    def aneis(self, cor, perfis, lados=20):
        """Cada anel: (centro_x, altura, centro_z, raio_x, raio_z)."""
        pontos = []
        for x, y, z, rx, rz in perfis:
            for i in range(lados):
                t = 2*math.pi*i/lados
                pontos.append((x+math.cos(t)*rx, y, z+math.sin(t)*rz))
        faces = []
        for j in range(len(perfis)-1):
            for i in range(lados):
                a = j*lados+i
                b = j*lados+(i+1)%lados
                c = (j+1)*lados+i
                d = (j+1)*lados+(i+1)%lados
                faces.extend(((a, c, b), (b, c, d)))
        self.malha(cor, pontos, faces)

    def elipsoide(self, cor, centro, raios, latitudes=12, longitudes=20):
        perfis = []
        for i in range(latitudes+1):
            t = -math.pi/2 + math.pi*i/latitudes
            r = max(0.0001, math.cos(t))
            perfis.append((centro[0], centro[1]+math.sin(t)*raios[1], centro[2], raios[0]*r, raios[2]*r))
        self.aneis(cor, perfis, longitudes)

    def segmento(self, cor, inicio, fim, r1, r2=None, lados=16):
        """Membro cônico com pequenas extremidades arredondadas."""
        r2 = r1 if r2 is None else r2
        eixo = unit(sub(fim, inicio))
        referencia = (0, 1, 0) if abs(eixo[1]) < .9 else (1, 0, 0)
        u = unit(cross(referencia, eixo))
        v = cross(eixo, u)
        pontos = []
        for t, fator in [(0, .72), (.10, 1), (.9, 1), (1, .72)]:
            raio = (r1*(1-t)+r2*t)*fator
            centro = tuple(inicio[k]*(1-t)+fim[k]*t for k in range(3))
            for i in range(lados):
                a = 2*math.pi*i/lados
                pontos.append(tuple(centro[k]+raio*(math.cos(a)*u[k]+math.sin(a)*v[k]) for k in range(3)))
        faces = []
        for j in range(3):
            for i in range(lados):
                a = j*lados+i; b = j*lados+(i+1)%lados
                c = (j+1)*lados+i; d = (j+1)*lados+(i+1)%lados
                faces.extend(((a, b, c), (b, d, c)))
        self.malha(cor, pontos, faces)

    def faixa(self, cor, pontos, largura):
        """Faixa fina sobre a frente da roupa."""
        vertices = []
        for x, y, z in pontos:
            vertices.extend(((x-largura/2, y, z), (x+largura/2, y, z)))
        faces = []
        for i in range(len(pontos)-1):
            a = 2*i
            faces.extend(((a, a+1, a+2), (a+1, a+3, a+2)))
        self.malha(cor, vertices, faces)

    def salvar(self, caminho):
        gltf = {'asset': {'version': '2.0', 'generator': 'gerar_personagens.py'},
                'scene': 0, 'scenes': [{'nodes': []}], 'nodes': [], 'meshes': [],
                'materials': [], 'buffers': [], 'bufferViews': [], 'accessors': []}
        dados = bytearray()

        def accessor(valores, tipo, componentes, formato, target):
            while len(dados) % 4: dados.append(0)
            inicio = len(dados)
            for valor in valores:
                if componentes == 1: dados.extend(struct.pack('<'+formato, valor))
                else: dados.extend(struct.pack('<'+formato*componentes, *valor))
            view = len(gltf['bufferViews'])
            gltf['bufferViews'].append({'buffer': 0, 'byteOffset': inicio,
                                        'byteLength': len(dados)-inicio, 'target': target})
            a = {'bufferView': view, 'componentType': 5126 if formato == 'f' else 5123,
                 'count': len(valores), 'type': tipo}
            if tipo == 'VEC3' and target == 34962:
                a['min'] = [min(p[k] for p in valores) for k in range(3)]
                a['max'] = [max(p[k] for p in valores) for k in range(3)]
            gltf['accessors'].append(a)
            return len(gltf['accessors'])-1

        for cor, (vertices, normals, indices) in self.grupos.items():
            if len(vertices) > 65535: raise ValueError('Malha excede índice de 16 bits')
            material = len(gltf['materials'])
            gltf['materials'].append({'doubleSided': True, 'pbrMetallicRoughness': {
                'baseColorFactor': [c/255 for c in cor]+[1], 'metallicFactor': 0,
                'roughnessFactor': .88}})
            pos = accessor(vertices, 'VEC3', 3, 'f', 34962)
            normal = accessor(normals, 'VEC3', 3, 'f', 34962)
            index = accessor(indices, 'SCALAR', 1, 'H', 34963)
            mesh = len(gltf['meshes'])
            gltf['meshes'].append({'primitives': [{'attributes': {'POSITION': pos, 'NORMAL': normal},
                                                  'indices': index, 'material': material}]})
            gltf['nodes'].append({'mesh': mesh})
            gltf['scenes'][0]['nodes'].append(mesh)

        while len(dados) % 4: dados.append(0)
        gltf['buffers'].append({'byteLength': len(dados)})
        texto = json.dumps(gltf, separators=(',', ':')).encode('utf-8')
        texto += b' ' * ((-len(texto)) % 4)
        tamanho = 12+8+len(texto)+8+len(dados)
        with caminho.open('wb') as f:
            f.write(struct.pack('<4sII', b'glTF', 2, tamanho))
            f.write(struct.pack('<I4s', len(texto), b'JSON')); f.write(texto)
            f.write(struct.pack('<I4s', len(dados), b'BIN\0')); f.write(dados)


def levi():
    m = Modelo()
    jaqueta = (125, 88, 61); sombra = (86, 60, 45); calca = (193, 188, 169)
    preto = (31, 35, 37); cabelo = (27, 27, 31); pele = (205, 166, 143)
    capa = (41, 90, 64); metal = (74, 81, 80); couro = (76, 58, 44)
    # Tronco e cintura definidos por contornos em vez de caixas.
    m.aneis(jaqueta, [(0,.75,0,.19,.13),(0,.82,0,.24,.16),(0,1.05,0,.25,.17),
                      (0,1.31,0,.30,.16),(0,1.40,0,.22,.13),(0,1.43,0,.12,.09)])
    m.aneis(couro, [(0,.75,0,.22,.155),(0,.80,0,.235,.17),(0,.84,0,.235,.17)])
    m.aneis(calca, [(0,.65,0,.18,.13),(0,.77,0,.22,.15),(0,.79,0,.21,.15)])
    # Pernas em ação com joelhos visíveis e botas curvas.
    for s in (-1, 1):
        quadril=(s*.13,.70,0); joelho=(s*.17,.43,.08 if s < 0 else -.05)
        tornozelo=(s*.19,.16,.18 if s < 0 else -.01)
        m.segmento(calca, quadril, joelho, .12, .105)
        m.elipsoide(calca, joelho, (.105,.105,.105), 8, 14)
        m.segmento(preto, joelho, tornozelo, .105, .085)
        m.elipsoide(preto, (tornozelo[0], .13, tornozelo[2]+.075), (.105,.115,.18))
        ombro=(s*.28,1.31,0); cotovelo=(s*.37,1.17,.18); mao=(s*.43,1.26,.46)
        m.segmento(jaqueta, ombro, cotovelo, .105, .078)
        m.elipsoide(jaqueta, cotovelo, (.08,.08,.08), 8, 14)
        m.segmento(jaqueta, cotovelo, mao, .075, .058)
        m.elipsoide(preto, mao, (.065,.075,.065), 8, 14)
        # Cilindros do equipamento e saída traseira para os jatos.
        m.aneis(metal, [(s*.42,.52,-.08,.12,.145),(s*.42,.57,-.08,.14,.155),
                        (s*.42,.78,-.08,.14,.155),(s*.42,.82,-.08,.11,.135)], 16)
        m.segmento(preto, (s*.42,.58,-.18), (s*.42,.58,-.24), .07, .055)
        m.faixa(couro, [(s*.11,1.34,.15),(s*.18,1.05,.17),(s*.20,.82,.16)], .045)
        m.faixa(couro, [(s*.23,1.31,.14),(s*.08,1.04,.18),(s*.08,.82,.16)], .037)
    m.elipsoide(pele,(0,1.46,0),(.095,.12,.09),10,16)
    # Lenço claro e gola da jaqueta definem melhor o uniforme.
    m.aneis((203,196,178), [(0,1.38,.045,.12,.09),(0,1.43,.045,.125,.095),
                            (0,1.47,.04,.10,.08)], 18)
    # Rosto com maxilar mais estreito e cabelo assimétrico.
    m.aneis(pele, [(0,1.52,.015,.09,.09),(0,1.57,.025,.14,.13),(0,1.70,.025,.17,.155),
                   (0,1.82,.015,.165,.145),(0,1.88,0,.13,.11)], 24)
    m.elipsoide(cabelo,(0,1.84,-.03),(.185,.13,.145),14,24)
    m.malha(cabelo, [(-.16,1.83,.105),(-.10,1.89,.12),(.04,1.90,.12),(.16,1.84,.105),
                     (-.145,1.76,.145),(-.085,1.79,.157),(-.04,1.75,.162),
                     (.00,1.79,.165),(.06,1.755,.157),(.10,1.80,.15),(.15,1.76,.135)],
            [(0,1,5),(0,5,4),(1,2,5),(2,7,5),(5,7,6),(2,3,7),
             (3,9,7),(7,9,8),(3,10,9)])
    m.elipsoide(pele,(0,1.675,.178),(.018,.038,.018),8,12)
    m.segmento((111,71,64),(-.035,1.625,.162),(.035,1.625,.162),.006,.006,8)
    for s in (-1,1):
        m.elipsoide(cabelo,(s*.16,1.77,.045),(.035,.085,.08),10,16)
        m.elipsoide((224,218,199),(s*.075,1.71,.168),(.034,.014,.009),8,12)
        m.elipsoide(preto,(s*.075,1.71,.178),(.013,.014,.007),8,12)
        m.segmento(cabelo,(s*.038,1.745,.168),(s*.11,1.735,.153),.008,.008,8)
    # Capa esvoaçante em superfície contínua e com borda assimétrica.
    m.malha(capa, [(-.27,1.36,-.10),(.27,1.36,-.10),(-.40,1.17,-.30),(.40,1.16,-.30),
                   (-.39,.83,-.53),(.36,.82,-.52),(-.28,.69,-.59),(.10,.76,-.61),(.31,.70,-.56)],
            [(0,2,1),(1,2,3),(2,4,3),(3,4,5),(4,6,7),(4,7,5),(5,7,8)])
    return m


def zeke():
    m=Modelo()
    pelo=(98,68,47); luz=(120,84,55); escuro=(65,46,34); pele=(183,143,105)
    pele_luz=(200,162,121); barba=(78,53,37); preto=(35,28,25)
    # Massa corporal contínua; os anéis fazem ombros largos e cintura estreita.
    m.aneis(pelo, [(0,.86,0,.34,.29),(0,1.05,0,.48,.38),(0,1.35,-.02,.57,.42),
                   (0,1.75,-.04,.65,.48),(0,2.12,-.05,.72,.48),(0,2.39,-.05,.75,.42),
                   (0,2.58,-.06,.60,.34),(0,2.69,-.03,.35,.25)], 28)
    m.elipsoide((106,73,49),(0,1.64,.32),(.43,.64,.15),14,24)
    for s in (-1,1):
        # Formas longas com sobreposição suave nas juntas.
        ombro=(s*.64,2.38,-.04); cotovelo=(s*1.02,1.65,.12); pulso=(s*1.25,.85,.38)
        m.elipsoide(pelo, ombro,(.30,.33,.28),12,20)
        m.segmento(pelo, ombro, cotovelo,.27,.23,20)
        m.elipsoide(pelo,cotovelo,(.235,.25,.22),12,20)
        m.segmento(pelo,cotovelo,pulso,.23,.16,20)
        m.elipsoide(escuro,(s*1.27,.78,.40),(.19,.23,.15),12,20)
        for k in range(4):
            m.elipsoide(escuro,(s*(1.14+k*.075),.64,.47),(.038,.105,.055),8,12)
        quadril=(s*.30,1.03,0); joelho=(s*.40,.58,.12); pe=(s*.43,.20,.26)
        m.segmento(pelo,quadril,joelho,.27,.23,20)
        m.elipsoide(pelo,joelho,(.23,.23,.22),10,16)
        m.segmento(pelo,joelho,pe,.21,.16,18)
        m.elipsoide(escuro,(s*.43,.14,.36),(.23,.14,.34),12,20)
        # Mechas discretas acompanham a direção da pelagem.
        for k in range(5):
            x=s*(.29+.085*k)
            m.segmento(luz,(x,2.30-.08*k,.365),(x+s*.035,2.11-.08*k,.39),.018,.006,8)
    m.aneis(pelo, [(0,2.54,0,.28,.25),(0,2.79,0,.27,.23),(0,2.91,.02,.30,.25)],24)
    # Rosto alongado, focinho e barba com volumes menos angulosos.
    m.aneis(pele, [(0,2.83,.11,.18,.16),(0,2.90,.12,.27,.23),(0,3.08,.08,.34,.29),
                   (0,3.29,.05,.36,.29),(0,3.43,.01,.30,.24),(0,3.50,0,.18,.15)],28)
    m.elipsoide(barba,(0,2.88,.26),(.32,.23,.20),14,24)
    m.elipsoide(pele_luz,(0,3.03,.34),(.25,.15,.16),14,24)
    m.elipsoide(preto,(0,2.99,.492),(.12,.019,.009),8,16)
    m.elipsoide(escuro,(0,3.44,-.055),(.39,.21,.31),14,24)
    for s in (-1,1):
        m.elipsoide(pele,(s*.34,3.13,.01),(.10,.14,.07),10,16)
        m.elipsoide(preto,(s*.15,3.22,.344),(.047,.035,.018),10,16)
        m.segmento(escuro,(s*.09,3.29,.35),(s*.23,3.27,.31),.035,.03,12)
        m.elipsoide(pele_luz,(s*.10,3.09,.465),(.035,.022,.015),8,12)
    return m


if __name__ == '__main__':
    DESTINO.mkdir(parents=True, exist_ok=True)
    for nome, funcao in [('levi', levi), ('zeke', zeke)]:
        caminho = DESTINO / (nome+'.glb')
        funcao().salvar(caminho)
        print(f'{caminho.name}: {caminho.stat().st_size} bytes')
