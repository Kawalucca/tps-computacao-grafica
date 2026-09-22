import { criarEntidade } from './entidade.js'

// O farol fica sempre no centro do mundo (0, 0) e nunca se move.
export const FAROL_RAIO = 40           // colisão e, na Fase 3, alcance de ataque
export const FAROL_VIDA_MAXIMA = 100

// Posição VISUAL da lâmpada (onde o feixe de luz "nasce" e gira), em relação
// ao centro do mundo. É diferente de (0,0) porque, no desenho, o farol fica
// de pé sobre a ilha, deslocado para cima — ver POSICAO_FAROL_VISUAL em main.js.
export const FAROL_LAMPADA = { x: 0, y: 170 }

const VELOCIDADE_GIRO_LUZ = Math.PI / 6 // rad/s (uma volta completa a cada 12s)

export function criarFarol() {
  return {
    ...criarEntidade({ x: 0, y: 0, raio: FAROL_RAIO, vida: FAROL_VIDA_MAXIMA }),
    anguloLuz: 0
  }
}

export function atualizarFarol(farol, dt) {
  farol.anguloLuz += VELOCIDADE_GIRO_LUZ * dt
  // não precisa "dar a volta" (module 2π): como é só usado dentro de sin/cos
  // na matriz de rotação, um ângulo grande funciona normalmente
}
