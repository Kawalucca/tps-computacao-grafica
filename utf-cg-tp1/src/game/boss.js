import { criarEntidade, causarDano } from './entidade.js'
import { criarProjetil } from './projetil.js'
import { adicionar } from '../engine/pool.js'
import { LARGURA_MUNDO, ALTURA_MUNDO } from '../engine/mundo.js'

const CENTRO_CAMINHO = { x: 0, y: -20 }
const RAIO_CAMINHO_INICIAL = 420
const RAIO_CAMINHO_FINAL = 190
const QUANTIDADE_WAYPOINTS = 18
const VELOCIDADE = 58
const VIDA = 500
const DANO_CONTATO = 35
const CADENCIA_TIRO = 1.8
const VELOCIDADE_PROJETIL = 300
const DURACAO_STUN = 1.5
const COR_BOSS = new Float32Array([1, 1, 1, 1])
const COR_PROJETIL_BOSS = new Float32Array([1, 0.32, 0.32, 1])

const WAYPOINTS = [
  { x: -LARGURA_MUNDO / 2 - 60, y: ALTURA_MUNDO / 2 + 60 },
  ...Array.from({ length: QUANTIDADE_WAYPOINTS }, (_, indice) => {
    const progresso = indice / (QUANTIDADE_WAYPOINTS - 1)
    const raio = RAIO_CAMINHO_INICIAL + (RAIO_CAMINHO_FINAL - RAIO_CAMINHO_INICIAL) * progresso
    const angulo = Math.PI * 3 / 4 + progresso * Math.PI * 2
    return {
      x: CENTRO_CAMINHO.x + Math.cos(angulo) * raio,
      y: CENTRO_CAMINHO.y + Math.sin(angulo) * raio
    }
  })
]
WAYPOINTS.push({ x: 0, y: 0 })

export function criarBoss() {
  return {
    ...criarEntidade({
      x: WAYPOINTS[0].x,
      y: WAYPOINTS[0].y,
      raio: 34,
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
    cor: COR_PROJETIL_BOSS
  })
  adicionar(projeteis, projetil)
  boss.cronometroTiro = CADENCIA_TIRO
  return projetil
}

export function caminhoDoBoss() {
  return WAYPOINTS
}
