// Ponto de entrada do diorama Attack on Titan.
import * as twgl from "./lib/twgl-full.module.js";

import { criarDisco, criarHemisferio } from "./scene/world.js";
import { criarMatrizModelo } from "./scene/transform.js";
import { criarRuinas } from "./scene/ruins.js";
import { criarDestrocos, criarVigas } from "./scene/debris.js";
import { criarEstadoCanhao, atualizarCanhao, obterPartesCanhao } from "./scene/cannon.js";
import { cameraFixa } from "./camera/cameras.js";

import { carregarModeloGLTF } from "./gltf/gltf-loader.js";
import { criarEstadoLevi } from "./scene/levi.js";
import { criarEstadoZeke } from "./scene/zeke.js";
import { criarMatrizPersonagem, obterPose, alternarPose } from "./scene/character.js";
import { configurarEntrada } from "./input/input.js";
import { criarPartesEspada } from "./scene/sword.js";

const m4 = twgl.m4;

async function carregarTexto(url) {
  const resposta = await fetch(url);
  if (!resposta.ok) {
    throw new Error(`Não foi possível carregar ${url}: HTTP ${resposta.status}.`);
  }
  return resposta.text();
}

function criarTexturaBranca(gl) {
  const textura = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, textura);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    1,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    new Uint8Array([255, 255, 255, 255])
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.bindTexture(gl.TEXTURE_2D, null);
  return textura;
}

async function tentarCarregarModelo(gl, url, nome) {
  try {
    const modelo = await carregarModeloGLTF(gl, twgl, url);
    console.info(`${nome} carregado: ${modelo.drawables.length} partes renderizáveis.`);
    return modelo;
  } catch (erro) {
    console.warn(`${nome} ainda não foi carregado. ${erro.message}`);
    return null;
  }
}

async function main() {
  const canvas = document.getElementById("canvas");
  const gl = canvas.getContext("webgl2");

  if (!gl) {
    throw new Error("WebGL 2 não está disponível neste navegador.");
  }

  twgl.setDefaults({ attribPrefix: "a_" });

  const [vs, fs, gltfVs, gltfFs] = await Promise.all([
    carregarTexto("src/shaders/solido.vert"),
    carregarTexto("src/shaders/solido.frag"),
    carregarTexto("src/shaders/gltf.vert"),
    carregarTexto("src/shaders/gltf.frag"),
  ]);

  const programa = twgl.createProgramInfo(gl, [vs, fs]);
  const programaGLTF = twgl.createProgramInfo(gl, [gltfVs, gltfFs]);

  const disco = twgl.createBufferInfoFromArrays(gl, criarDisco(4, 64));
  const hemisferio = twgl.createBufferInfoFromArrays(gl, criarHemisferio(4, 64, 20));
  const cubo = twgl.primitives.createCubeBufferInfo(gl, 1);
  const esfera = twgl.primitives.createSphereBufferInfo(gl, 1, 16, 12);
  const cilindro = twgl.primitives.createCylinderBufferInfo(gl, 0.5, 1, 16, 1);

  const ruinas = criarRuinas();
  const destrocos = criarDestrocos();
  const vigas = criarVigas();
  const canhao = criarEstadoCanhao();

  const levi = criarEstadoLevi();
  const zeke = criarEstadoZeke();
  const texturaBranca = criarTexturaBranca(gl);

  // Os modelos definitivos são colocados em assets/models.
  // Na ausência deles, o projeto usa formas provisórias para permitir testar a composição.
  const [modeloLevi, modeloZeke] = await Promise.all([
    tentarCarregarModelo(gl, "assets/models/levi.glb", "Levi"),
    tentarCarregarModelo(gl, "assets/models/zeke.glb", "Zeke"),
  ]);

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.clearColor(0.08, 0.10, 0.13, 1);

  function desenharObjeto(geometria, modelo, cor, camera) {
    gl.useProgram(programa.program);
    twgl.setBuffersAndAttributes(gl, programa, geometria);
    twgl.setUniforms(programa, {
      u_model: modelo,
      u_view: camera.view,
      u_projection: camera.projection,
      u_color: cor,
    });
    twgl.drawBufferInfo(gl, geometria);
  }

  function desenharLista(lista, geometria, camera) {
    for (const objeto of lista) {
      const modelo = criarMatrizModelo(
        m4,
        objeto.posicao,
        objeto.escala,
        objeto.rotacao
      );
      desenharObjeto(geometria, modelo, objeto.cor, camera);
    }
  }

  function desenharPartesCanhao(camera) {
    for (const parte of obterPartesCanhao(canhao, m4)) {
      let geometria = cubo;
      if (parte.geometria === "esfera") geometria = esfera;
      if (parte.geometria === "cilindro") geometria = cilindro;
      desenharObjeto(geometria, parte.matriz, parte.cor, camera);
    }
  }

  function desenharModelo(modelo, matrizRaiz, camera) {
    if (!modelo) return;

    gl.useProgram(programaGLTF.program);

    for (const parte of modelo.drawables) {
      const material = parte.material;
      const matrizFinal = m4.multiply(matrizRaiz, parte.matrizNo);

      if (material.doubleSided) {
        gl.disable(gl.CULL_FACE);
      } else {
        gl.enable(gl.CULL_FACE);
      }

      if (material.alphaMode === "BLEND") {
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      }

      twgl.setBuffersAndAttributes(gl, programaGLTF, parte.bufferInfo);
      twgl.setUniforms(programaGLTF, {
        u_model: matrizFinal,
        u_view: camera.view,
        u_projection: camera.projection,
        u_color: material.cor,
        u_baseColorTexture: material.textura || texturaBranca,
        u_useTexture: Boolean(material.textura),
      });
      twgl.drawBufferInfo(gl, parte.bufferInfo);

      if (material.alphaMode === "BLEND") {
        gl.disable(gl.BLEND);
      }
    }

    gl.enable(gl.CULL_FACE);
  }

  function desenharLeviProvisorio(camera, matrizRaiz) {
    const partes = [
      { pos: [0, 0.83, 0], scale: [0.32, 0.48, 0.20], color: [0.20, 0.25, 0.29, 1] },
      { pos: [0, 1.43, 0], scale: [0.18, 0.21, 0.18], color: [0.78, 0.66, 0.55, 1] },
      { pos: [0, 0.88, -0.19], scale: [0.47, 0.63, 0.045], color: [0.13, 0.22, 0.18, 1] },
      { pos: [-0.12, 0.28, 0], scale: [0.11, 0.34, 0.12], color: [0.16, 0.18, 0.21, 1] },
      { pos: [0.12, 0.28, 0], scale: [0.11, 0.34, 0.12], color: [0.16, 0.18, 0.21, 1] },
    ];

    for (const parte of partes) {
      const local = criarMatrizModelo(m4, parte.pos, parte.scale);
      desenharObjeto(cubo, m4.multiply(matrizRaiz, local), parte.color, camera);
    }
  }

  function desenharZekeProvisorio(camera, matrizRaiz) {
    const partes = [
      { pos: [0, 1.05, 0], scale: [0.85, 1.15, 0.48], color: [0.43, 0.34, 0.27, 1], geo: cubo },
      { pos: [0, 2.05, 0.02], scale: [0.42, 0.43, 0.39], color: [0.48, 0.38, 0.30, 1], geo: esfera },
      { pos: [-0.91, 1.20, 0], scale: [0.25, 0.90, 0.25], color: [0.43, 0.34, 0.27, 1], geo: cilindro },
      { pos: [0.91, 1.20, 0], scale: [0.25, 0.90, 0.25], color: [0.43, 0.34, 0.27, 1], geo: cilindro },
    ];

    for (const parte of partes) {
      const local = criarMatrizModelo(m4, parte.pos, parte.scale);
      desenharObjeto(parte.geo, m4.multiply(matrizRaiz, local), parte.color, camera);
    }
  }

  function desenharEspada(camera, poseLevi) {
    for (const parte of criarPartesEspada(m4, poseLevi)) {
      desenharObjeto(cubo, parte.matriz, parte.cor, camera);
    }
  }

  configurarEntrada(() => {
    const pose = alternarPose(levi);
    console.info(`Levi: pose ${pose + 1} — ${obterPose(levi).nome}`);
  });

  let tempoAnterior = 0;

  function desenhar(agora) {
    const delta = tempoAnterior === 0
      ? 0
      : Math.min((agora - tempoAnterior) / 1000, 0.05);
    tempoAnterior = agora;

    atualizarCanhao(canhao, delta);

    twgl.resizeCanvasToDisplaySize(canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const camera = cameraFixa(canvas);

    desenharObjeto(hemisferio, m4.identity(), [0.16, 0.18, 0.21, 1], camera);
    desenharObjeto(disco, m4.identity(), [0.48, 0.42, 0.34, 1], camera);

    desenharLista(ruinas, cubo, camera);
    desenharLista(destrocos, esfera, camera);
    desenharLista(vigas, cilindro, camera);
    desenharPartesCanhao(camera);

    const matrizZeke = criarMatrizPersonagem(zeke, modeloZeke, twgl);
    const matrizLevi = criarMatrizPersonagem(levi, modeloLevi, twgl);

    if (modeloZeke) desenharModelo(modeloZeke, matrizZeke, camera);
    else desenharZekeProvisorio(camera, matrizZeke);

    if (modeloLevi) desenharModelo(modeloLevi, matrizLevi, camera);
    else desenharLeviProvisorio(camera, matrizLevi);

    desenharEspada(camera, obterPose(levi));

    requestAnimationFrame(desenhar);
  }

  requestAnimationFrame(desenhar);
}

main().catch((erro) => {
  console.error(erro);
  const mensagem = document.createElement("pre");
  mensagem.style.cssText = "position:fixed;left:12px;top:12px;color:white;background:#7b1d1d;padding:12px;white-space:pre-wrap;max-width:90vw;";
  mensagem.textContent = `Erro ao iniciar a cena:\n${erro.message}`;
  document.body.appendChild(mensagem);
});
