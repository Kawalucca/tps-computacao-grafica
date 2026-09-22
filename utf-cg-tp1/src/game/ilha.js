// A ilha funciona como OBSTÁCULO: bloqueia o barco, mas não tem vida nem
// leva dano (por isso não é uma "entidade" de entidade.js, só posição + raio).
//
// Esta posição/raio é a fonte única usada tanto pela física (barco.js, via
// afastarDeObstaculo) quanto pelo desenho (main.js), para nunca ficarem
// dessincronizados — se a arte final da ilha for maior/menor, ajuste RAIO
// aqui uma vez só.
export const ILHA = {
  x: 0,
  y: -20,
  raio: 140 // maior que o FAROL_RAIO (alcance de ataque, Fase 3): cobre a "terra firme" ao redor da torre
}