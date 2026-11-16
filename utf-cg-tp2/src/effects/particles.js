import * as twgl from "../lib/twgl-full.module.js";

// A fumaça do chão e os pequenos jatos do equipamento usam os mesmos quads,
// mas têm cores, tamanhos e trajetórias independentes.
export function criarParticulas() {
  let semente = 63173;
  function aleatorio() {
    semente = (semente * 1664525 + 1013904223) >>> 0;
    return semente / 4294967296;
  }

  // Os dois focos laterais formam os rastros verticais dos sinalizadores.
  // Os demais continuam como fumaça baixa sobre a clareira.
  const focos = [
    { posicao: [-2.8, 0.06, 1.35], coluna: true },
    { posicao: [2.6, 0.06, -0.65], coluna: true },
    { posicao: [0.1, 0.06, 2.65], coluna: false },
    { posicao: [0.4, 0.06, -2.5], coluna: false },
  ];
  const particulas = [];
  for (const foco of focos) {
    const quantidade = foco.coluna ? 56 : 16;
    for (let i = 0; i < quantidade; i++) {
      particulas.push({
        tipo: foco.coluna ? "coluna" : "chao", foco: foco.posicao, fase: aleatorio(),
        velocidade: 0.08 + aleatorio() * 0.07,
        x: (aleatorio() - 0.5) * (foco.coluna ? 0.3 : 0.7),
        z: (aleatorio() - 0.5) * (foco.coluna ? 0.3 : 0.7),
        tamanho: 0.22 + aleatorio() * 0.12, giro: aleatorio() * Math.PI * 2,
        posicao: [0, 0, 0], escala: 0, alpha: 0,
      });
    }
  }
  for (const lado of [-1, 1]) {
    for (let i = 0; i < 12; i++) {
      particulas.push({
        tipo: "jato", lado, fase: aleatorio(),
        velocidade: 0.9 + aleatorio() * 0.4,
        x: (aleatorio() - 0.5) * 0.025,
        giro: aleatorio() * Math.PI * 2,
        tamanho: 0.025 + aleatorio() * 0.025,
        posicao: [0, 0, 0], escala: 0, alpha: 0,
      });
    }
  }

  return {
    particulas,
    atualizar(delta, tempo, matrizLevi) {
      for (const p of particulas) {
        p.fase = (p.fase + delta * p.velocidade) % 1;
        const t = p.fase;
        if (p.tipo === "chao" || p.tipo === "coluna") {
          const coluna = p.tipo === "coluna";
          p.posicao = [
            p.foco[0] + p.x + t * (coluna ? 0.12 : 0.25) + Math.sin(tempo * 0.35 + p.giro) * 0.06,
            p.foco[1] + t * (coluna ? 4.5 : 0.32),
            p.foco[2] + p.z,
          ];
          p.escala = p.tamanho * (0.8 + t * 0.5);
          p.alpha = Math.sin(Math.PI * t) * 0.27;
          p.cor = [0.67, 0.91, 0.60];
        } else if (matrizLevi) {
          // As posições estão no espaço local do modelo e seguem a pose de Levi.
          p.posicao = twgl.m4.transformPoint(matrizLevi, [
            p.lado * 0.42 + p.x + Math.sin(tempo * 4 + p.giro) * t * 0.015,
            0.58 - t * 0.10,
            -0.22 - t * 0.32,
          ]);
          p.escala = p.tamanho * (1 + t * 1.3);
          p.alpha = Math.sin(Math.PI * t) * 0.48;
          p.cor = [0.97, 0.98, 1.0];
        }
      }
    },
  };
}

export function criarRenderizadorParticulas(gl, vert, frag) {
  const programa = twgl.createProgramInfo(gl, [vert, frag]);
  const bufferInfo = twgl.createBufferInfoFromArrays(gl, {
    position: { numComponents: 2, data: [-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1] },
  });

  return {
    desenhar(estado, camera) {
      // Ordenação aproximada fundo -> frente para mistura alfa correta.
      const lista = [...estado.particulas].sort((a, b) => {
        const da = a.posicao.reduce((s, v, i) => s + (v - camera.olho[i]) ** 2, 0);
        const db = b.posicao.reduce((s, v, i) => s + (v - camera.olho[i]) ** 2, 0);
        return db - da;
      });

      gl.useProgram(programa.program);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.disable(gl.CULL_FACE);
      gl.depthMask(false);
      twgl.setBuffersAndAttributes(gl, programa, bufferInfo);
      for (const p of lista) {
        twgl.setUniforms(programa, {
          u_view: camera.view,
          u_projection: camera.projection,
          u_position: p.posicao,
          u_size: p.escala,
          u_alpha: p.alpha,
          u_color: p.cor,
        });
        twgl.drawBufferInfo(gl, bufferInfo);
      }
      gl.depthMask(true);
      gl.disable(gl.BLEND);
      gl.enable(gl.CULL_FACE);
    },
  };
}
