"""Gera as malhas estáticas dos personagens em GLB 2.0, sem dependências.

As superfícies são compostas por anéis e triângulos, com normais interpoladas.
Executar a partir de qualquer pasta: py tools/gerar_personagens.py
"""
import json
import math
import random
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

    def aneis(self, cor, perfis, lados=20, suavidade=3, fechar=False):
        """Anéis elípticos com perfil suavizado: (x, altura, z, raio_x, raio_z)."""
        def interpolar(a, b, c, d, t):
            return .5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t)

        amostras = []
        for j in range(len(perfis)-1):
            a, b = perfis[max(0, j-1)], perfis[j]
            c, d = perfis[j+1], perfis[min(len(perfis)-1, j+2)]
            for passo in range(suavidade):
                t = passo/suavidade
                perfil = tuple(interpolar(a[k], b[k], c[k], d[k], t) for k in range(5))
                amostras.append((*perfil[:3], max(.0001, perfil[3]), max(.0001, perfil[4])))
        amostras.append(perfis[-1])
        pontos = []
        for x, y, z, rx, rz in amostras:
            for i in range(lados):
                t = 2*math.pi*i/lados
                pontos.append((x+math.cos(t)*rx, y, z+math.sin(t)*rz))
        faces = []
        for j in range(len(amostras)-1):
            for i in range(lados):
                a = j*lados+i
                b = j*lados+(i+1)%lados
                c = (j+1)*lados+i
                d = (j+1)*lados+(i+1)%lados
                faces.extend(((a, c, b), (b, c, d)))
        if fechar:
            base, topo = len(pontos), len(pontos)+1
            pontos.extend((amostras[0][:3], amostras[-1][:3]))
            ultimo = (len(amostras)-1)*lados
            for i in range(lados):
                proximo = (i+1)%lados
                faces.extend(((base, i, proximo), (topo, ultimo+proximo, ultimo+i)))
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

    def membro(self, cor, perfis, lados=24, subdivisoes=6):
        """Superfície contínua por pontos (posição, raio), com juntas suaves.

        O eixo e os raios são interpolados por Catmull–Rom. Cada anel é
        perpendicular ao eixo local, evitando as emendas de cilindros e esferas.
        """
        def interpolar(a, b, c, d, t):
            return .5 * ((2*b) + (-a+c)*t +
                         (2*a-5*b+4*c-d)*t*t + (-a+3*b-3*c+d)*t*t*t)

        amostras = []
        for j in range(len(perfis)-1):
            a = perfis[max(j-1, 0)]
            b, c = perfis[j], perfis[j+1]
            d = perfis[min(j+2, len(perfis)-1)]
            for passo in range(subdivisoes):
                t = passo/subdivisoes
                amostras.append(tuple(interpolar(a[k], b[k], c[k], d[k], t) for k in range(4)))
        amostras.append(perfis[-1])
        pontos = []
        for j, amostra in enumerate(amostras):
            anterior = amostras[max(j-1, 0)]
            proxima = amostras[min(j+1, len(amostras)-1)]
            eixo = unit(sub(proxima[:3], anterior[:3]))
            referencia = (0, 0, 1) if abs(eixo[2]) < .85 else (1, 0, 0)
            u = unit(cross(referencia, eixo))
            v = cross(eixo, u)
            for i in range(lados):
                angulo = 2*math.pi*i/lados
                pontos.append(tuple(amostra[k]+amostra[3]*(math.cos(angulo)*u[k] +
                                    math.sin(angulo)*v[k]) for k in range(3)))
        faces = []
        for j in range(len(amostras)-1):
            for i in range(lados):
                a = j*lados+i; b = j*lados+(i+1)%lados
                c = (j+1)*lados+i; d = (j+1)*lados+(i+1)%lados
                faces.extend(((a, b, c), (b, d, c)))
        self.malha(cor, pontos, faces)

    def pelos_membro(self, perfis, sorteio, quantidade=500, subdivisoes=6):
        """Fios curtos sobre os braços, seguindo a superfície curva do membro."""
        def interpolar(a, b, c, d, t):
            return .5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t)

        amostras = []
        for j in range(len(perfis)-1):
            a, b = perfis[max(j-1, 0)], perfis[j]
            c, d = perfis[j+1], perfis[min(j+2, len(perfis)-1)]
            for passo in range(subdivisoes):
                t = passo/subdivisoes
                amostras.append(tuple(interpolar(a[k], b[k], c[k], d[k], t) for k in range(4)))
        amostras.append(perfis[-1])

        def ponto(j, angulo):
            amostra = amostras[j]
            anterior, proxima = amostras[max(j-1, 0)], amostras[min(j+1, len(amostras)-1)]
            eixo = unit(sub(proxima[:3], anterior[:3]))
            referencia = (0, 0, 1) if abs(eixo[2]) < .85 else (1, 0, 0)
            u = unit(cross(referencia, eixo))
            v = cross(eixo, u)
            raio = amostra[3] + .008
            return tuple(amostra[k] + raio*(math.cos(angulo)*u[k] + math.sin(angulo)*v[k])
                         for k in range(3))

        for _ in range(quantidade):
            j = sorteio.randrange(len(amostras)-1)
            angulo = sorteio.uniform(0, 2*math.pi)
            inicio = sorteio.uniform(.05, .55)
            fim = min(.95, inicio+sorteio.uniform(.22, .48))
            desvio = sorteio.uniform(-.035, .035)
            largura = sorteio.uniform(.008, .016)
            pontos = []
            for t, a in [(inicio, angulo-largura), (inicio, angulo+largura),
                         (fim, angulo+desvio-largura), (fim, angulo+desvio+largura)]:
                p, q = ponto(j, a), ponto(j+1, a)
                pontos.append(tuple(p[k]*(1-t)+q[k]*t for k in range(3)))
            cor = (117, 81, 55) if sorteio.random() < .5 else (82, 56, 40)
            self.malha(cor, pontos, [(0, 1, 2), (1, 3, 2)])

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

    def superficie_frontal(self, cor, linhas, colunas=24):
        """Painel curvo para detalhes que acompanham o rosto sem virar esferas."""
        pontos = []
        for y, largura, centro_z, profundidade in linhas:
            for i in range(colunas+1):
                u = 2*i/colunas-1
                curvatura = math.sqrt(max(0, 1-u*u))
                pontos.append((largura*u, y, centro_z-profundidade*(1-curvatura)))
        faces = []
        for j in range(len(linhas)-1):
            for i in range(colunas):
                a = j*(colunas+1)+i; b = a+1
                c = a+colunas+1; d = c+1
                faces.extend(((a, b, c), (b, d, c)))
        self.malha(cor, pontos, faces)

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


def cabelo_cuia(modelo, cor):
    """Calota fechada com franja lisa e borda inferior embutida no crânio."""
    lados, aneis = 64, 18
    topo, centro_z = 1.975, .015
    pontos = [(0, topo, centro_z)]

    def borda(angulo):
        frente = max(0, math.sin(angulo))
        nuca = max(0, -math.sin(angulo))
        return 1.73 + .038*frente**3 - .015*nuca**2

    for j in range(1, aneis+1):
        latitude = (math.pi/2)*j/aneis
        raio = math.sin(latitude)
        for i in range(lados):
            angulo = 2*math.pi*i/lados
            altura_borda = borda(angulo)
            pontos.append((.196*raio*math.cos(angulo),
                           altura_borda+(topo-altura_borda)*math.cos(latitude),
                           centro_z+.19*raio*math.sin(angulo)))

    # Leque no topo e costura circular: nenhuma abertura entre calota e franja.
    faces = [(0, 1+(i+1)%lados, 1+i) for i in range(lados)]
    for j in range(aneis-1):
        for i in range(lados):
            a, b = 1+j*lados+i, 1+j*lados+(i+1)%lados
            c, d = a+lados, b+lados
            faces.extend(((a, b, c), (b, d, c)))

    # A borda arredondada dobra para dentro da cabeça e fecha por baixo.
    inicio_interno = len(pontos)
    for i in range(lados):
        angulo = 2*math.pi*i/lados
        pontos.append((.174*math.cos(angulo), borda(angulo)+.014,
                       centro_z+.163*math.sin(angulo)))
    centro_interno = len(pontos)
    pontos.append((0, 1.80, centro_z))
    for i in range(lados):
        a, b = 1+(aneis-1)*lados+i, 1+(aneis-1)*lados+(i+1)%lados
        c, d = inicio_interno+i, inicio_interno+(i+1)%lados
        faces.extend(((a, b, c), (b, d, c), (c, d, centro_interno)))
    modelo.malha(cor, pontos, faces)


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
        m.membro(calca, [(*quadril, .12),
                         (s*.15,.56,.035 if s < 0 else -.025,.113), (*joelho, .105)])
        m.membro(preto, [(*joelho, .106),
                         (s*.18,.30,.13 if s < 0 else -.03,.092), (*tornozelo, .085)])
        m.elipsoide(preto, (tornozelo[0], .13, tornozelo[2]+.075), (.105,.115,.18))
        ombro=(s*.28,1.31,0); cotovelo=(s*.37,1.17,.18); mao=(s*.43,1.26,.46)
        m.membro(jaqueta, [(*ombro, .105), (*cotovelo, .078), (*mao, .058)])
        m.elipsoide(preto, mao, (.065,.075,.065), 8, 14)
        # Cilindros do equipamento e saída traseira para os jatos.
        m.aneis(metal, [(s*.42,.52,-.08,.12,.145),(s*.42,.57,-.08,.14,.155),
                        (s*.42,.78,-.08,.14,.155),(s*.42,.82,-.08,.11,.135)], 16)
        m.segmento(preto, (s*.42,.58,-.18), (s*.42,.58,-.24), .07, .055)
        m.faixa(couro, [(s*.11,1.34,.15),(s*.18,1.05,.17),(s*.20,.82,.16)], .045)
        m.faixa(couro, [(s*.23,1.31,.14),(s*.08,1.04,.18),(s*.08,.82,.16)], .037)
    # Lenço claro e gola da jaqueta definem melhor o uniforme.
    m.aneis((203,196,178), [(0,1.38,.045,.12,.09),(0,1.43,.045,.125,.095),
                            (0,1.47,.04,.10,.08)], 18)
    # Rosto com maxilar mais estreito e cabelo liso em uma peça fechada.
    m.aneis(pele, [(0,1.37,0,.075,.073),(0,1.47,0,.09,.09),
                   (0,1.52,.015,.09,.09),(0,1.57,.025,.14,.13),(0,1.70,.025,.17,.155),
                   (0,1.82,.015,.165,.145),(0,1.88,0,.13,.11)], 24)
    cabelo_cuia(m, cabelo)
    m.elipsoide(pele,(0,1.675,.178),(.018,.038,.018),8,12)
    m.segmento((111,71,64),(-.035,1.625,.162),(.035,1.625,.162),.006,.006,8)
    for s in (-1,1):
        m.elipsoide((224,218,199),(s*.075,1.71,.168),(.034,.014,.009),8,12)
        m.elipsoide(preto,(s*.075,1.71,.178),(.013,.014,.007),8,12)
        m.segmento(cabelo,(s*.038,1.745,.168),(s*.11,1.735,.153),.008,.008,8)
    # Capa esvoaçante em superfície contínua e com borda assimétrica.
    m.malha(capa, [(-.27,1.36,-.10),(.27,1.36,-.10),(-.40,1.17,-.30),(.40,1.16,-.30),
                   (-.39,.83,-.53),(.36,.82,-.52),(-.28,.69,-.59),(.10,.76,-.61),(.31,.70,-.56)],
            [(0,2,1),(1,2,3),(2,4,3),(3,4,5),(4,6,7),(4,7,5),(5,7,8)])
    return m


def barba_zeke(modelo, cor):
    """Barba cheia e arredondada, apoiada na mandíbula e no pescoço."""
    modelo.aneis(cor, [(0,2.64,.255,.040,.035),
                      (0,2.70,.270,.150,.065),
                      (0,2.78,.285,.235,.095),
                      (0,2.88,.300,.300,.110),
                      (0,2.96,.310,.310,.105),
                      (0,3.03,.320,.265,.075),
                      (0,3.07,.290,.180,.075)], lados=40, suavidade=4, fechar=True)


def zeke():
    m=Modelo()
    pelo=(98,68,47); luz=(120,84,55); escuro=(65,46,34); pele=(183,143,105)
    pele_luz=(200,162,121); barba=(78,53,37); preto=(35,28,25)
    # Massa corporal contínua; os anéis fazem ombros largos e cintura estreita.
    perfis_corpo = [(0,.86,0,.34,.29),(0,1.05,0,.48,.38),(0,1.35,-.02,.57,.42),
                    (0,1.75,-.04,.65,.48),(0,2.12,-.05,.72,.48),(0,2.39,-.05,.75,.42),
                    (0,2.58,-.06,.60,.34),(0,2.69,-.03,.38,.27),
                    (0,2.80,-.02,.30,.24),(0,2.96,.01,.33,.26),
                    (0,3.12,.02,.35,.29),(0,3.29,.01,.35,.28),
                    (0,3.42,0,.30,.24),(0,3.50,-.01,.18,.15),
                    (0,3.54,-.01,.001,.001)]
    m.aneis(pelo, perfis_corpo, 32)

    # Reproduz a interpolação dos anéis para assentar os detalhes no tronco.
    def interpolar(a, b, c, d, t):
        return .5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t)

    perfil_tronco = []
    for j in range(7):
        a, b = perfis_corpo[max(j-1, 0)], perfis_corpo[j]
        c, d = perfis_corpo[j+1], perfis_corpo[min(j+2, len(perfis_corpo)-1)]
        for passo in range(3):
            t = passo/3
            perfil_tronco.append(tuple(interpolar(a[k], b[k], c[k], d[k], t) for k in range(5)))
    perfil_tronco.append(perfis_corpo[7])

    def perfil_em(y):
        for a, b in zip(perfil_tronco, perfil_tronco[1:]):
            if a[1] <= y <= b[1]:
                t = (y-a[1])/(b[1]-a[1])
                return tuple(a[k]*(1-t)+b[k]*t for k in (2, 3, 4))
        raise ValueError('Altura fora do tronco')

    def superficie_tronco(x, y, afastamento=.014):
        z, rx, rz = perfil_em(y)
        return z+rz*math.sqrt(max(0, 1-(x/rx)**2))+afastamento

    # Fios no tronco e nos braços dão textura à pelagem vista de vários ângulos.
    sorteio = random.Random(27)
    for _ in range(1800):
        y = sorteio.uniform(.96, 2.53)
        comprimento = sorteio.uniform(.025, .065)
        angulo = sorteio.uniform(0, 2*math.pi)
        z, rx, rz = perfil_em(y)
        z2, rx2, rz2 = perfil_em(y+comprimento)
        desvio = sorteio.uniform(-.035, .035)
        largura = sorteio.uniform(.006, .014)
        pontos = []
        for cx, cy, crx, crz, a in [(z, y, rx, rz, angulo-largura),
                                     (z, y, rx, rz, angulo+largura),
                                     (z2, y+comprimento, rx2, rz2, angulo+desvio-largura),
                                     (z2, y+comprimento, rx2, rz2, angulo+desvio+largura)]:
            pontos.append(((crx+.009)*math.cos(a), cy, cx+(crz+.009)*math.sin(a)))
        cor = (117, 81, 55) if sorteio.random() < .5 else (82, 56, 40)
        m.malha(cor, pontos, [(0, 1, 2), (1, 3, 2)])

    # Pele da cor do rosto: peitorais largos e abdômen afinado até a cintura.
    contorno = [(1.08,.08), (1.18,.18), (1.38,.24), (1.62,.27), (1.85,.31),
                (2.02,.38), (2.18,.50), (2.30,.53), (2.39,.45), (2.47,.26), (2.50,.08)]
    for (y0, w0), (y1, w1) in zip(contorno, contorno[1:]):
        for passo in range(3):
            t0, t1 = passo/3, (passo+1)/3
            pontos = []
            for t in (t0, t1):
                y, largura = y0*(1-t)+y1*t, w0*(1-t)+w1*t
                for i in range(25):
                    x = largura*(2*i/24-1)
                    pontos.append((x, y, superficie_tronco(x, y, .018)))
            faces = []
            for i in range(24):
                faces.extend(((i, i+1, 25+i), (i+1, 26+i, 25+i)))
            m.malha(pele, pontos, faces)

    def traco_anatomico(x0, y0, x1, y1, largura=.012):
        dx, dy = x1-x0, y1-y0
        comprimento = math.hypot(dx, dy)
        nx, ny = -dy*largura/(2*comprimento), dx*largura/(2*comprimento)
        pontos = [(x+sx*nx, y+sx*ny, superficie_tronco(x+sx*nx, y+sx*ny, .025))
                  for x, y in ((x0, y0), (x1, y1)) for sx in (-1, 1)]
        m.malha((157, 117, 86), pontos, [(0, 1, 2), (1, 3, 2)])

    for s in (-1, 1):
        traco_anatomico(s*.025, 2.17, s*.39, 2.14, .014)
        for y, largura in [(1.94,.24), (1.74,.21), (1.54,.17)]:
            traco_anatomico(s*.035, y, s*largura, y+.018, .009)
    for s in (-1,1):
        # Braços e pernas formam superfícies contínuas, sem bolas nas juntas.
        ombro=(s*.52,2.37,-.04); cotovelo=(s*1.02,1.65,.12); pulso=(s*1.25,.85,.38)
        perfil_braco = [(*ombro,.29), (s*.81,2.08,.035,.275),
                        (*cotovelo,.225), (s*1.15,1.20,.25,.205), (*pulso,.16)]
        m.membro(pelo, perfil_braco)
        m.pelos_membro(perfil_braco, sorteio)
        m.elipsoide(escuro,(s*1.27,.78,.40),(.19,.23,.15),12,20)
        for k in range(4):
            m.elipsoide(escuro,(s*(1.14+k*.075),.64,.47),(.038,.105,.055),8,12)
        quadril=(s*.30,1.03,0); joelho=(s*.40,.58,.12); pe=(s*.43,.20,.26)
        perfil_perna = [(*quadril,.27), (s*.35,.80,.07,.25),
                        (*joelho,.22), (s*.42,.38,.19,.185), (*pe,.16)]
        m.membro(pelo, perfil_perna)
        m.pelos_membro(perfil_perna, sorteio, quantidade=220)
        m.elipsoide(escuro,(s*.43,.14,.36),(.23,.14,.34),12,20)
    # A barba ganha espessura e acompanha o pescoço, sem se afastar dele.
    m.superficie_frontal(pele, [(2.87,.10,.265,.08),(2.96,.23,.34,.14),
                               (3.10,.30,.365,.17),(3.24,.30,.36,.16),
                               (3.36,.27,.32,.14),(3.43,.19,.265,.10),
                               (3.46,.06,.21,.04)])
    barba_zeke(m, barba)
    m.superficie_frontal(pele_luz, [(2.99,.08,.405,.015),(3.02,.17,.43,.045),
                                   (3.08,.19,.44,.05),(3.12,.14,.405,.035)])
    m.segmento(preto,(-.11,3.01,.431),(.11,3.01,.431),.008,.008,10)
    for s in (-1,1):
        m.elipsoide(pele,(s*.32,3.13,.01),(.075,.105,.055),10,16)
        m.elipsoide(preto,(s*.145,3.22,.355),(.034,.018,.008),10,16)
        m.segmento(escuro,(s*.09,3.27,.36),(s*.22,3.255,.32),.022,.018,12)
        m.elipsoide(preto,(s*.07,3.075,.438),(.017,.009,.006),8,12)
    return m


if __name__ == '__main__':
    DESTINO.mkdir(parents=True, exist_ok=True)
    for nome, funcao in [('levi', levi), ('zeke', zeke)]:
        caminho = DESTINO / (nome+'.glb')
        funcao().salvar(caminho)
        print(f'{caminho.name}: {caminho.stat().st_size} bytes')
