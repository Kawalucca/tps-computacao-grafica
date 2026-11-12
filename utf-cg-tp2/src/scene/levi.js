import { criarEstadoPersonagem } from "./character.js";

// Posições e orientações de Levi no diorama.
// A primeira pose é a posição principal de ataque; as demais permitem alternar o enquadramento.
export const POSES_LEVI = [
  {
    nome: "Ataque",
    posicao: [1.15, 0.12, 0.45],
    rotacao: [0, -Math.PI / 2, 0],
  },
  {
    nome: "Lateral",
    posicao: [1.75, 0.12, 1.05],
    rotacao: [0, -1.15, 0],
  },
  {
    nome: "Aterrissagem",
    posicao: [0.55, 0.12, 1.45],
    rotacao: [0, 0.20, 0],
  },
];

export function criarEstadoLevi() {
  return criarEstadoPersonagem(POSES_LEVI, 1.65);
}
