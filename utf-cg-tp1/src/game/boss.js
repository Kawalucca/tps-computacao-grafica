import { criarEntidade, causarDano } from './entidade.js'
import { criarProjetil } from './projetil.js'
import { ILHA } from './ilha.js'
import { adicionar } from '../engine/pool.js'
import { LARGURA_MUNDO, ALTURA_MUNDO } from '../engine/mundo.js'

const RAIO_BOSS = 34

// Caminho em espiral ELÍPTICA ao redor da ilha (mais larga que alta, como a
// tela). Uma espiral circular de raio 420 descia até y≈-354, com o sprite do
// boss (~160 de altura com o brilho) saindo pela borda de baixo (-360).
// Raio vertical inicial de 250 mantém o centro do boss dentro de ±280.
const RAIO_CAMINHO_INICIAL = { x: 520, y: 250 }
// o fim da espiral fica na COSTA, nunca dentro da ilha: distância mínima ao
// centro = raio da ilha + raio do boss (mesmo limite do barco e dos piratas)
const RAIO_CAMINHO_FINAL = { x: 215, y: ILHA.raio + RAIO_BOSS + 16 }
const QUANTIDADE_WAYPOINTS = 18
const VELOCIDADE = 58
// balanceamento (ver conversa de ajuste): com os números originais
// (vida 500, cadência 1.8s, atordoamento 1.5s) o DPS efetivo do jogador
// contra o boss ficava em ~5/s (o atordoamento anulava ~83% da cadência do
// barco, e o farol só alcança o boss numa fração do caminho em espiral) —
// matar as 500 vidas levaria ~100s, mas o boss mata o farol (100 HP) em
// ~2.9s de contato, chegando lá bem antes. Valores abaixo são um meio-termo
// deliberado: ainda difícil (exige desviar/reposicionar o barco), mas
// matável dentro do tempo que o boss leva pra percorrer o caminho.
const VIDA = 320
const DANO_CONTATO = 35
const CADENCIA_TIRO = 2.2
const VELOCIDADE_PROJETIL = 300
const DURACAO_STUN = 1.2
const COR_BOSS = new Float32Array([1, 1, 1, 1])

// o último ponto é o fim da espiral, já na costa: ao chegar lá, o boss para e
// passa a atacar o farol (não navega mais até o centro da ilha)
const WAYPOINTS = [
  { x: -LARGURA_MUNDO / 2 - 60, y: ALTURA_MUNDO / 2 + 60 },
  ...Array.from({ length: QUANTIDADE_WAYPOINTS }, (_, indice) => {
    const progresso = indice / (QUANTIDADE_WAYPOINTS - 1)
    const raioX = RAIO_CAMINHO_INICIAL.x + (RAIO_CAMINHO_FINAL.x - RAIO_CAMINHO_INICIAL.x) * progresso
    const raioY = RAIO_CAMINHO_INICIAL.y + (RAIO_CAMINHO_FINAL.y - RAIO_CAMINHO_INICIAL.y) * progresso
    const angulo = Math.PI * 3 / 4 + progresso * Math.PI * 2
    return {
      x: ILHA.x + Math.cos(angulo) * raioX,
      y: ILHA.y + Math.sin(angulo) * raioY
    }
  })
]

export function criarBoss() {
  return {
    ...criarEntidade({
      x: WAYPOINTS[0].x,
      y: WAYPOINTS[0].y,
      raio: RAIO_BOSS,
      vida: VIDA
    }),
    tipoId: 'boss',
    velocidade: VELOCIDADE,
    danoContato: DANO_CONTATO,
    escala: 2,
    cor: COR_BOSS,
    flashRestante: 0,
    indiceWaypoint: 1,
    cronometroTiro: CADENCIA_TIRO
  }
}

export function atualizarBoss(boss, farol, dt) {
  boss.flashRestante = Math.max(0, boss.flashRestante - dt)

  let waypoint = WAYPOINTS[boss.indiceWaypoint]
  let dx = waypoint.x - boss.x
  let dy = waypoint.y - boss.y
  let distancia = Math.hypot(dx, dy)
  const deslocamento = boss.velocidade * dt

  if (distancia <= deslocamento) {
    boss.x = waypoint.x
    boss.y = waypoint.y
    if (boss.indiceWaypoint === WAYPOINTS.length - 1) {
      causarDano(farol, boss.danoContato * dt)
      return
    }
    boss.indiceWaypoint++
    waypoint = WAYPOINTS[boss.indiceWaypoint]
    dx = waypoint.x - boss.x
    dy = waypoint.y - boss.y
    distancia = Math.hypot(dx, dy)
  }

  if (distancia > 0) {
    boss.x += (dx / distancia) * deslocamento
    boss.y += (dy / distancia) * deslocamento
  }

  if (boss.indiceWaypoint === WAYPOINTS.length - 1 && distancia <= boss.raio) {
    causarDano(farol, boss.danoContato * dt)
  }
}

export function atualizarDisparoBoss(boss, barco, projeteis, dt) {
  boss.cronometroTiro -= dt
  if (boss.cronometroTiro > 0) return null

  const projetil = criarProjetil({
    x: boss.x,
    y: boss.y,
    alvo: barco,
    dano: 0,
    velocidade: VELOCIDADE_PROJETIL,
    duracaoMaxima: 5,
    alvoTipo: 'heroi',
    aoAcertar: (heroi) => {
      heroi.stunRestante = Math.max(heroi.stunRestante || 0, DURACAO_STUN)
    },
    categoria: 'holandes'
  })
  adicionar(projeteis, projetil)
  boss.cronometroTiro = CADENCIA_TIRO
  return projetil
}

export function caminhoDoBoss() {
  return WAYPOINTS
}
