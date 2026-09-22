// Dificuldade crescente (enunciado): "a frequência de inimigos deve
// aumentar com o tempo". Em vez de um INTERVALO_SPAWN fixo, o intervalo
// diminui aos poucos conforme o tempo de jogo passa, até um piso mínimo —
// para não ficar impossível de jogar depois de alguns minutos.
//
// Função pura (sem estado, sem efeito colateral): dado o tempo decorrido,
// sempre devolve o mesmo intervalo. Fácil de testar e de ajustar (são só 3
// números) sem tocar em mais nada do spawn.

const INTERVALO_SPAWN_INICIAL = 1.8 // segundos, no começo do jogo
const INTERVALO_SPAWN_MINIMO = 0.5  // nunca fica mais rápido que isso
const TEMPO_ATE_DIFICULDADE_MAXIMA = 90 // segundos de jogo até atingir o intervalo mínimo

/** Interpolação linear simples entre o intervalo inicial e o mínimo. */
export function calcularIntervaloSpawn(tempoDecorrido) {
  const progresso = Math.min(tempoDecorrido / TEMPO_ATE_DIFICULDADE_MAXIMA, 1)
  return INTERVALO_SPAWN_INICIAL + (INTERVALO_SPAWN_MINIMO - INTERVALO_SPAWN_INICIAL) * progresso
}
