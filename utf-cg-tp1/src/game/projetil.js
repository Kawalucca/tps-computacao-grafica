import { criarEntidade, causarDano, estaViva, estaoColidindo } from './entidade.js'

export const PROJETIL_RAIO = 6
const VELOCIDADE_PADRAO = 420 // unidades do mundo por segundo
const DURACAO_MAXIMA_PADRAO = 3 // segundos; evita "projétil fantasma" se o alvo morrer no meio do caminho

// ---- spritesheet de projéteis: grade fixa de 3 colunas (estados de
// animação) x 4 linhas (categorias), a mesma para qualquer projétil do jogo.
// v=0 no topo, como todo o resto do jogo (ver renderizador-sprites.js).
const COLUNAS_SPRITESHEET = 3
const LINHAS_SPRITESHEET = 4

const LINHA_POR_CATEGORIA = { farol: 0, barco: 1, inimigo: 2, holandes: 3 }
const COLUNA_POR_ESTADO = { disparo: 0, voo: 1, impacto: 2 }

/** Cada quadro da grade tem essa proporção (largura/altura) — usado no desenho
 *  (main.js) pra não esticar/achatar a arte ao definir o tamanho na tela. */
export const PROPORCAO_QUADRO_PROJETIL = (1 / COLUNAS_SPRITESHEET) / (1 / LINHAS_SPRITESHEET)

// as 12 regiões UV são calculadas UMA vez aqui (não a cada quadro do jogo) e
// só consultadas depois — mesmo cuidado de "zero alocação por sprite" do
// resto do motor (ver renderizador-sprites.js)
const UV_POR_CATEGORIA_E_ESTADO = {}
for (const categoria in LINHA_POR_CATEGORIA) {
  const linha = LINHA_POR_CATEGORIA[categoria]
  UV_POR_CATEGORIA_E_ESTADO[categoria] = {}
  for (const estado in COLUNA_POR_ESTADO) {
    const coluna = COLUNA_POR_ESTADO[estado]
    UV_POR_CATEGORIA_E_ESTADO[categoria][estado] = new Float32Array([
      coluna / COLUNAS_SPRITESHEET, linha / LINHAS_SPRITESHEET,
      1 / COLUNAS_SPRITESHEET, 1 / LINHAS_SPRITESHEET
    ])
  }
}

/** Região UV (do spritesheet único de projéteis) para uma categoria + estado
 *  de animação. `categoria` é uma das chaves de LINHA_POR_CATEGORIA (farol,
 *  barco, inimigo, holandes); `estado`, uma de COLUNA_POR_ESTADO. */
export function uvProjetil(categoria, estado) {
  return UV_POR_CATEGORIA_E_ESTADO[categoria][estado]
}

// exportadas para o desenho (main.js) poder calcular o PROGRESSO (0..1) de
// cada fase e animar escala/opacidade suavemente, em vez de só trocar o
// quadro estático — como cada estado tem uma única imagem no spritesheet, a
// "animação" vem inteira da interpolação em cima desse único quadro
export const DURACAO_DISPARO = 0.08 // segundos "parado" no quadro de disparo antes de sair voando
export const DURACAO_IMPACTO = 0.22 // segundos mostrando a explosão antes de sumir de vez

/**
 * Projétil genérico, usado por farol, barco, boss etc.: nasce em (x, y),
 * mira no `alvo` NO INSTANTE DO DISPARO e viaja em linha reta — não persegue
 * depois de lançado (isso é o suficiente para o TP1).
 *
 * `dano` e `aoAcertar` ficam guardados no PRÓPRIO projétil, em vez de fixos
 * no código, de propósito: o míssil de stun do Holandês Voador (boss.js)
 * reaproveita este mesmo módulo passando um `aoAcertar` diferente (atordoa
 * em vez de causar dano) — sem precisar duplicar ou reescrever nada aqui.
 *
 * `categoria` escolhe a linha do spritesheet (ver LINHA_POR_CATEGORIA) — cada
 * projétil nasce no estado 'disparo', passa para 'voo' sozinho depois de
 * DURACAO_DISPARO, e vira 'impacto' ao colidir (ver verificarImpacto),
 * ficando visível mais um instante antes de ser removido de vez.
 */
export function criarProjetil({
  x, y, alvo, dano, categoria,
  velocidade = VELOCIDADE_PADRAO,
  duracaoMaxima = DURACAO_MAXIMA_PADRAO,
  aoAcertar = causarDano,
  alvoTipo = 'inimigo',
  cor = null // opcional, só para o desenho tingir o sprite por cima da arte própria
}) {
  const dx = alvo.x - x
  const dy = alvo.y - y
  const distancia = Math.hypot(dx, dy) || 1 // nasceu em cima do alvo: evita divisão por zero

  return {
    ...criarEntidade({ x, y, raio: PROJETIL_RAIO, vida: 1 }),
    vx: (dx / distancia) * velocidade,
    vy: (dy / distancia) * velocidade,
    dano,
    aoAcertar,
    alvo,
    alvoTipo,
    duracaoMaxima,
    tempoDeVoo: 0,
    cor,
    categoria,
    estadoAnimacao: 'disparo',
    tempoAnimacao: DURACAO_DISPARO
  }
}

export function atualizarProjetil(projetil, dt) {
  if (projetil.estadoAnimacao === 'disparo') {
    // ainda no "flash" do canhão: parado na posição de nascimento
    projetil.tempoAnimacao -= dt
    if (projetil.tempoAnimacao <= 0) projetil.estadoAnimacao = 'voo'
    return
  }

  if (projetil.estadoAnimacao === 'impacto') {
    // já colidiu: só espera a animação de explosão terminar pra sumir
    projetil.tempoAnimacao -= dt
    if (projetil.tempoAnimacao <= 0) projetil.vida = 0
    return
  }

  // estado 'voo': comportamento normal de deslocamento
  projetil.x += projetil.vx * dt
  projetil.y += projetil.vy * dt

  projetil.tempoDeVoo += dt
  if (projetil.tempoDeVoo >= projetil.duracaoMaxima) {
    projetil.vida = 0 // expira sem ter acertado nada (ex.: o alvo já tinha morrido)
  }
}

/**
 * Se o projétil (em voo) colidiu com o alvo, aplica o efeito dele
 * (`aoAcertar`) e entra no estado 'impacto' (para de se mover e passa a
 * mostrar a animação de explosão por DURACAO_IMPACTO, antes de "morrer" de
 * verdade — ver atualizarProjetil). Devolve true se acertou.
 */
export function verificarImpacto(projetil, alvo) {
  if (projetil.estadoAnimacao !== 'voo') return false
  if (!estaViva(projetil) || !estaViva(alvo)) return false
  if (!estaoColidindo(projetil, alvo)) return false

  projetil.aoAcertar(alvo, projetil.dano)
  projetil.estadoAnimacao = 'impacto'
  projetil.tempoAnimacao = DURACAO_IMPACTO
  // vx/vy NÃO são zerados: atualizarProjetil já para de mover no estado
  // 'impacto', mas o desenho (main.js) usa esses valores pra manter a
  // explosão apontando pra direção em que o projétil vinha voando
  return true
}
