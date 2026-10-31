// Ponto de entrada e loop de renderização.
import * as twgl from "./lib/twgl-full.module.js";
import { criarDisco } from "./scene/world.js";
import { cameraFixa } from "./camera/cameras.js";

const m4 = twgl.m4;

async function carregarTexto(url) {
  const resposta = await fetch(url);
  if (!resposta.ok) throw new Error(`Falha ao carregar ${url}`);
  return resposta.text();
}

async function main() {
  const canvas = document.getElementById("canvas");
  const gl = canvas.getContext("webgl2");
  if (!gl) {
    throw new Error("WebGL2 não disponível neste navegador");
  }

  // Módulos ES não importam .glsl, então os shaders vêm por fetch (por isso precisa de servidor local).
  const [vs, fs] = await Promise.all([
    carregarTexto("src/shaders/solido.vert"),
    carregarTexto("src/shaders/solido.frag"),
  ]);
  const programa = twgl.createProgramInfo(gl, [vs, fs]);

  const disco = twgl.createBufferInfoFromArrays(gl, criarDisco(4, 64));

  // Depth test: sem ele, o que é desenhado por último ficaria por cima mesmo estando atrás.
  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0.05, 0.06, 0.12, 1);

  let anterior = 0;

  function desenhar(agora) {
    const delta = (agora - anterior) / 1000; // segundos; ainda não usado, as animações vão precisar
    anterior = agora;

    // Mantém o buffer interno do canvas com o mesmo tamanho em pixels do que aparece na tela.
    twgl.resizeCanvasToDisplaySize(canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const { projection, view } = cameraFixa(canvas);

    gl.useProgram(programa.program);
    twgl.setBuffersAndAttributes(gl, programa, disco);
    twgl.setUniforms(programa, {
      u_model: m4.identity(), // o disco já está na origem, sem transformação
      u_view: view,
      u_projection: projection,
      u_color: [0.55, 0.5, 0.42, 1],
    });
    twgl.drawBufferInfo(gl, disco);

    requestAnimationFrame(desenhar);
  }
  requestAnimationFrame(desenhar);
}

main().catch(console.error);
