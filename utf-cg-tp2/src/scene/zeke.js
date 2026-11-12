import { criarEstadoPersonagem } from "./character.js";

// Zeke fica à esquerda de Levi e voltado para o lado do ataque.
export const POSES_ZEKE = [
  {
    nome: "Titã Bestial",
    posicao: [-0.85, 0.05, 0.45],
    rotacao: [0, Math.PI / 2, 0],
  },
];

export function criarEstadoZeke() {
  return criarEstadoPersonagem(POSES_ZEKE, 2.85);
}
