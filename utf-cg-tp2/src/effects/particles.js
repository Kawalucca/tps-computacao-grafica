import * as twgl from "../lib/twgl-full.module.js";

// Pequena simulação determinística de partículas.
// O eixo Y sobe; o vento desloca as partículas no eixo X.
export function criarParticulas(quantidade = 115) {
  let semente = 63173;
  function aleatorio() {
    semente = (semente * 1664525 + 1013904223) >>> 0;
    return semente / 4294967296;
  }

  const focos = [
    [-1.3, 0.25, 0.05],
    [-2.25, 0.3, -0.80],
    [0.15, 0.20, 2.10],
    [1.9, 0.15, -1.25],
  ];

  const particulas = [];
  for (let i = 0; i < quantidade; i++) {
    const foco = focos[i % focos.length];
    particulas.push({
      foco,
      fase: aleatorio(),
      velocidade: 0.13 + 0.28 * aleatorio(),
      tamanho: 0.35 + aleatorio() * 0.67,
      x: (aleatorio() - 0.5) * 0.65,
      z: (aleatorio() - 0.5) * 0.65,
      giro: aleatorio() * Math.PI * 2,
      tipo: i % 6 === 0 ? "poeira" : "fumaça",
      posicao: [0, 0, 0],
      alpha: 0,
    });
  }

  return {
    particulas,
    atualizar(delta, tempo) {
      for (const p of particulas) {
        p.fase = (p.fase + delta * p.velocidade * 0.23) % 1;
        const crescimento = p.fase;
        const vento = Math.sin(tempo * 0.45 + p.giro) * 0.22;
        p.posicao = [
          p.foco[0] + p.x + crescimento * 1.25 + vento,
          p.foco[1] + crescimento * 3.1,
          p.foco[2] + p.z + Math.cos(tempo * 0.32 + p.giro) * 0.15,
        ];
        // Entrada/saída suave evita saltos ao reiniciar o ciclo.
        p.alpha = Math.sin(Math.PI * crescimento) * (p.tipo === "poeira" ? 0.20 : 0.28);
        p.escala = p.tamanho * (0.8 + 1.15 * crescimento);
      }
    },
  };
}

export function criarRenderizadorParticulas(gl, vert, frag) {
  const programa = twgl.createProgramInfo(gl, [vert, frag]);
  // Quad em espaço local; shader ajusta os eixos da câmera (billboard).
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
          u_dust: p.tipo === "poeira",
        });
        twgl.drawBufferInfo(gl, bufferInfo);
      }
      gl.depthMask(true);
      gl.disable(gl.BLEND);
      gl.enable(gl.CULL_FACE);
    }
  };
}
