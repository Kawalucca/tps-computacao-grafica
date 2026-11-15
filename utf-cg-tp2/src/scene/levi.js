import { criarEstadoPersonagem } from "./character.js";

// Posições e orientações de Levi no diorama.
// A primeira pose é a posição principal de ataque; as demais permitem alternar o enquadramento.
export const POSES_LEVI = [
  {
    nome: "Ataque",
    posicao: [1.45, 0.62, 0.12],
    rotacao: [0, -Math.PI / 2, 0],
  },
  {
    nome: "Lateral",
    posicao: [1.85, 0.42, 0.96],
    rotacao: [0, -1.15, 0],
  },
  {
    nome: "Aterrissagem",
    posicao: [0.75, 0.13, 1.55],
    rotacao: [0, 0.20, 0],
  },
];

export function criarEstadoLevi() {
  return criarEstadoPersonagem(POSES_LEVI, 1.65);
}
