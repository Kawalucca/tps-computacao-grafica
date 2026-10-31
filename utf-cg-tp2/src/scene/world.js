// Chão circular, bola de lã (hemisfério) e objetos de cenário.

// Disco no plano XZ (y = 0), centrado na origem, como um leque de triângulos:
// um vértice no centro e um anel de vértices na borda; cada fatia liga o centro a dois vértices vizinhos.
export function criarDisco(raio, segmentos) {
  // Centro primeiro (índice 0); depois o anel. O anel tem segmentos + 1 vértices:
  // o último repete o primeiro para a coordenada de textura poder dar a volta (0 -> 1) sem emenda errada.
  const position = [0, 0, 0];
  const normal = [0, 1, 0];
  const texcoord = [0.5, 0.5];
  const indices = [];

  for (let i = 0; i <= segmentos; i++) {
    const angulo = (i / segmentos) * Math.PI * 2;
    const c = Math.cos(angulo);
    const s = Math.sin(angulo);

    position.push(raio * c, 0, raio * s);
    normal.push(0, 1, 0); // chão plano: todas as normais apontam para cima
    // Projeção planar: mapeia o círculo inteiro dentro do quadrado de textura [0,1]x[0,1]
    texcoord.push(0.5 + 0.5 * c, 0.5 + 0.5 * s);
  }

  for (let i = 0; i < segmentos; i++) {
    // Ordem (centro, i+1, i) deixa a face voltada para +Y no sentido anti-horário (frente do triângulo)
    indices.push(0, i + 2, i + 1);
  }

  return {
    position: { numComponents: 3, data: position },
    normal: { numComponents: 3, data: normal },
    texcoord: { numComponents: 2, data: texcoord },
    indices: { numComponents: 3, data: indices },
  };
}
