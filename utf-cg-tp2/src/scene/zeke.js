import { criarEstadoPersonagem } from "./character.js";

// Zeke fica à esquerda de Levi e voltado para o lado do ataque.
export const POSES_ZEKE = [
  {
    nome: "Titã Bestial",
    posicao: [-1.45, 0.02, -0.15],
    rotacao: [0, Math.PI / 2, 0],
  },
];

export function criarEstadoZeke() {
  return criarEstadoPersonagem(POSES_ZEKE, 3.15);
}
