import * as twgl from "../lib/twgl-full.module.js";

const m4 = twgl.m4;
const limitar = (valor, minimo, maximo) => Math.max(minimo, Math.min(maximo, valor));

// As duas câmeras sempre olham para o centro do diorama.
export function criarEstadoCamera() {
  return {
    ativa: 1,
    alvo: [0, 0, 0],
    distanciaAutomatica: 10.8,
    anguloAutomatico: 0.12,
    distanciaOrbital: 10.3,
    anguloOrbital: 0.32,
    elevacaoOrbital: 0.48,
  };
}

export function selecionarCamera(estado, numero) {
  if (numero === 1 || numero === 2) estado.ativa = numero;
}

export function atualizarCamera(estado, delta) {
  // Visão 1: movimentação suave, independente da taxa de quadros.
  estado.anguloAutomatico += delta * 0.075;
}

export function aproximarCamera(estado, deslocamentoRoda) {
  const fator = Math.exp(deslocamentoRoda * 0.001);
  if (estado.ativa === 1) {
    estado.distanciaAutomatica = limitar(estado.distanciaAutomatica * fator, 6.4, 20);
  } else {
    estado.distanciaOrbital = limitar(estado.distanciaOrbital * fator, 5.5, 20);
  }
}

export function orbitarCamera(estado, dx, dy) {
  if (estado.ativa !== 2) return;
  estado.anguloOrbital -= dx * 0.007;
  estado.elevacaoOrbital = limitar(estado.elevacaoOrbital + dy * 0.006, 0.10, 1.48);
}

export function obterCamera(estado, canvas) {
  const aspecto = Math.max(1, canvas.width) / Math.max(1, canvas.height);
  const projection = m4.perspective(55 * Math.PI / 180, aspecto, 0.1, 160);

  let olho;
  if (estado.ativa === 1) {
    const r = estado.distanciaAutomatica;
    const horizontal = r / Math.sqrt(2);
    const vertical = r / Math.sqrt(2); // 45 graus acima do chão
    olho = [
      Math.sin(estado.anguloAutomatico) * horizontal,
      estado.alvo[1] + vertical,
      Math.cos(estado.anguloAutomatico) * horizontal,
    ];
  } else {
    const r = estado.distanciaOrbital;
    const horizontal = Math.cos(estado.elevacaoOrbital) * r;
    olho = [
      Math.sin(estado.anguloOrbital) * horizontal,
      estado.alvo[1] + Math.sin(estado.elevacaoOrbital) * r,
      Math.cos(estado.anguloOrbital) * horizontal,
    ];
  }
  const view = m4.inverse(m4.lookAt(olho, estado.alvo, [0, 1, 0]));
  return { view, projection, olho };
}
