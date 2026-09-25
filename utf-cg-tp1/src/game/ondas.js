// Sistema de ondas: substitui o spawn infinito da Fase 3 por waves com
// início, meio e fim — o "conceito de ondas de inimigos (fases)" do
// enunciado, permitindo "momentos de maior tensão ou maior relaxamento".
//
// Cada wave é uma lista de GRUPOS (tipo + quantidade), spawnados em
// sequência. Ao terminar de nascer uma wave, esperamos a arena ficar vazia
// (todo mundo morto) antes de contar o descanso e começar a próxima — assim
// o "relaxamento" é de verdade (sem inimigo nenhum na tela), não só uma
// pausa no spawn com o resto da wave anterior ainda perseguindo o jogador.
//
// Depois da wave 3 (a última definida aqui), o gerenciador fica no estado
// 'concluido' e para de gerar qualquer coisa — é o gancho para a Fase 5
// conectar o chefe (Holandês Voador) nesse ponto, sem precisar mexer nesta
// máquina de estados.
export const ONDAS = [
  // wave 1: introduz o batedor (rápido e frágil)
  [{ tipo: 'batedor', quantidade: 5 }],
  // wave 2: batedores + o pirata padrão
  [{ tipo: 'batedor', quantidade: 4 }, { tipo: 'padrao', quantidade: 5 }],
  // wave 3: os 3 tipos juntos, incluindo o brutamontes
  [{ tipo: 'batedor', quantidade: 4 }, { tipo: 'padrao', quantidade: 5 }, { tipo: 'brutamontes', quantidade: 3 }]
]

const INTERVALO_SPAWN_DENTRO_DA_ONDA = 1.1 // segundos entre um inimigo e o próximo, na mesma wave
const DESCANSO_ENTRE_ONDAS = 5 // segundos de respiro depois que a arena fica vazia

export function criarGerenciadorOndas() {
  return {
    indiceOnda: 0,
    indiceGrupo: 0,
    spawnadosNoGrupo: 0,
    cronometroSpawn: 0,
    cronometroDescanso: 0,
    // 'gerando': spawnando a wave atual
    // 'aguardandoLimpeza': a wave terminou de nascer, esperando a arena esvaziar
    // 'descansando': arena vazia, contando o respiro antes da próxima wave
    // 'concluido': as 3 waves acabaram — gancho para a Fase 5 (chefe)
    estado: 'gerando'
  }
}

/**
 * Chame uma vez por quadro. `inimigosAtivos` é a quantidade de inimigos
 * vivos AGORA (ex.: `inimigos.quantidade` da pool). Devolve o tipoId de um
 * inimigo para nascer NESTE quadro, ou `null` se não é hora de nascer nada
 * (o chamador decide o que fazer com o tipo — normalmente `criarInimigo`).
 */
export function atualizarOndas(gerenciador, inimigosAtivos, dt) {
  if (gerenciador.estado === 'concluido') return null

  if (gerenciador.estado === 'aguardandoLimpeza') {
    if (inimigosAtivos > 0) return null
    gerenciador.estado = 'descansando'
    gerenciador.cronometroDescanso = DESCANSO_ENTRE_ONDAS
  }

  if (gerenciador.estado === 'descansando') {
    gerenciador.cronometroDescanso -= dt
    if (gerenciador.cronometroDescanso > 0) return null

    gerenciador.indiceOnda++
    if (gerenciador.indiceOnda >= ONDAS.length) {
      gerenciador.estado = 'concluido'
      return null
    }
    gerenciador.indiceGrupo = 0
    gerenciador.spawnadosNoGrupo = 0
    gerenciador.cronometroSpawn = 0
    gerenciador.estado = 'gerando'
    // segue direto para o bloco abaixo: nasce o primeiro inimigo da nova
    // wave já neste quadro, sem esperar mais um ciclo
  }

  // gerenciador.estado === 'gerando'
  gerenciador.cronometroSpawn -= dt
  if (gerenciador.cronometroSpawn > 0) return null

  const onda = ONDAS[gerenciador.indiceOnda]
  const grupo = onda[gerenciador.indiceGrupo]

  gerenciador.spawnadosNoGrupo++
  gerenciador.cronometroSpawn = INTERVALO_SPAWN_DENTRO_DA_ONDA

  if (gerenciador.spawnadosNoGrupo >= grupo.quantidade) {
    gerenciador.indiceGrupo++
    gerenciador.spawnadosNoGrupo = 0
    if (gerenciador.indiceGrupo >= onda.length) {
      gerenciador.estado = 'aguardandoLimpeza'
    }
  }

  return grupo.tipo
}
