// Trabalho Prático 2 — Attack on Titan (WebGL2 + TWGL.js).
// Etapas 1–5: terreno, hierarquia, modelos GLB, câmeras, iluminação e efeitos.
import * as twgl from "./lib/twgl-full.module.js";
import { criarDisco, criarHemisferio } from "./scene/world.js";
import { criarMatrizModelo } from "./scene/transform.js";
import { criarRuinas } from "./scene/ruins.js";
import { criarDestrocos, criarVigas } from "./scene/debris.js";
import { criarEstadoCanhao, atualizarCanhao, obterPartesCanhao } from "./scene/cannon.js";
import { criarTecido, obterBandeiras } from "./scene/flags.js";
import {
  criarEstadoCamera, selecionarCamera, atualizarCamera, aproximarCamera,
  orbitarCamera, obterCamera,
} from "./camera/cameras.js";
import { criarEstadoLuz, uniformsLuz } from "./lighting/lights.js";
import { configurarEntrada } from "./input/input.js";
import { criarCeu } from "./effects/sky.js";
import { criarParticulas, criarRenderizadorParticulas } from "./effects/particles.js";
import { criarAudioAmbiente } from "./audio/audio.js";
import { carregarModeloGLTF } from "./gltf/gltf-loader.js";
import { criarEstadoLevi } from "./scene/levi.js";
import { criarEstadoZeke } from "./scene/zeke.js";
import { criarMatrizPersonagem, obterPose, alternarPose } from "./scene/character.js";
import { criarPartesEspada } from "./scene/sword.js";

const m4 = twgl.m4;

async function carregarTexto(url) {
  const resposta = await fetch(url);
  if (!resposta.ok) throw new Error(`Falha ao carregar ${url}: HTTP ${resposta.status}.`);
  return resposta.text();
}

function criarTexturaBranca(gl) {
  const textura = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, textura);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
    new Uint8Array([255, 255, 255, 255]));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  return textura;
}

async function carregarModelo(gl, url, nome) {
  try {
    const modelo = await carregarModeloGLTF(gl, twgl, url);
    console.info(`${nome}: ${modelo.drawables.length} malhas carregadas.`);
    return modelo;
  } catch (erro) {
    console.warn(`${nome}: ${erro.message}. Usando formas de emergência.`);
    return null;
  }
}

async function main() {
  const canvas = document.getElementById("canvas");
  const status = document.getElementById("status");
  const ui = document.getElementById("ajuda");
  const botaoSom = document.getElementById("audio-toggle");
  const gl = canvas.getContext("webgl2", { antialias: true });
  if (!gl) throw new Error("Seu navegador não disponibilizou WebGL 2.");

  twgl.setDefaults({ attribPrefix: "a_" });
  const shaders = await Promise.all([
    "solido.vert", "solido.frag", "gltf.vert", "gltf.frag",
    "sky.vert", "sky.frag", "particle.vert", "particle.frag",
  ].map((nome) => carregarTexto(`src/shaders/${nome}`)));
  const programaSolido = twgl.createProgramInfo(gl, shaders.slice(0, 2));
  const programaGLTF = twgl.createProgramInfo(gl, shaders.slice(2, 4));
  const ceu = criarCeu(gl, ...shaders.slice(4, 6));
  const particulas = criarParticulas();
  const renderizadorParticulas = criarRenderizadorParticulas(gl, ...shaders.slice(6, 8));

  const geometrias = {
    disco: twgl.createBufferInfoFromArrays(gl, criarDisco(4, 96)),
    hemisferio: twgl.createBufferInfoFromArrays(gl, criarHemisferio(4, 96, 32)),
    cubo: twgl.primitives.createCubeBufferInfo(gl, 1),
    esfera: twgl.primitives.createSphereBufferInfo(gl, 1, 16, 12),
    cilindro: twgl.primitives.createCylinderBufferInfo(gl, 0.5, 1, 16, 1),
    tecido: twgl.createBufferInfoFromArrays(gl, criarTecido()),
  };

  const branco = criarTexturaBranca(gl);
  const nomesTexturas = ["terra", "pedra", "madeira", "metal", "rocha"];
  const texturas = {};
  for (const nome of nomesTexturas) {
    texturas[nome] = twgl.createTexture(gl, {
      src: `assets/textures/${nome}.png`,
      min: gl.LINEAR_MIPMAP_LINEAR,
      mag: gl.LINEAR,
      wrap: gl.REPEAT,
    });
  }

  const ruinas = criarRuinas();
  const destrocos = criarDestrocos();
  const vigas = criarVigas();
  const bandeiras = obterBandeiras();
  const canhao = criarEstadoCanhao();
  const levi = criarEstadoLevi();
  const zeke = criarEstadoZeke();
  const cameraEstado = criarEstadoCamera();
  const luz = criarEstadoLuz();
  const audio = criarAudioAmbiente();

  const [modeloLevi, modeloZeke] = await Promise.all([
    carregarModelo(gl, "assets/models/levi.glb", "Levi"),
    carregarModelo(gl, "assets/models/zeke.glb", "Zeke"),
  ]);

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.clearColor(0.14, 0.16, 0.19, 1);

  function desenharObjeto(geometria, modelo, cor, camera, opcoes = {}) {
    gl.useProgram(programaSolido.program);
    if (opcoes.duplaFace) gl.disable(gl.CULL_FACE);
    else gl.enable(gl.CULL_FACE);
    twgl.setBuffersAndAttributes(gl, programaSolido, geometria);
    twgl.setUniforms(programaSolido, {
      u_model: modelo,
      u_normalMatrix: m4.transpose(m4.inverse(modelo)),
      u_view: camera.view,
      u_projection: camera.projection,
      u_color: cor,
      u_texScale: opcoes.texScale || [1, 1],
      u_baseColorTexture: opcoes.textura || branco,
      u_useTexture: Boolean(opcoes.textura),
      u_shininess: opcoes.brilho || 24,
      u_specularStrength: opcoes.especular ?? 0.09,
      u_alphaCutoff: 0,
      u_time: tempo,
      u_windStrength: opcoes.vento || 0,
      ...uniformsLuz(luz, camera),
    });
    twgl.drawBufferInfo(gl, geometria);
  }

  function desenharLista(lista, geometria, camera, textura, brilho = 12) {
    for (const obj of lista) {
      desenharObjeto(geometria, criarMatrizModelo(m4, obj.posicao, obj.escala, obj.rotacao),
        obj.cor, camera, { textura, brilho, texScale: [1.5, 1.5] });
    }
  }

  function desenharCanhao(camera) {
    for (const parte of obterPartesCanhao(canhao, m4)) {
      desenharObjeto(geometrias[parte.geometria], parte.matriz, parte.cor, camera,
        { textura: texturas.metal, brilho: 65, especular: 0.42 });
    }
  }

  function desenharBandeiras(camera) {
    for (const bandeira of bandeiras) {
      desenharObjeto(geometrias.cilindro,
        criarMatrizModelo(m4, bandeira.haste, bandeira.escalaHaste),
        [0.54, 0.47, 0.39, 1], camera, { textura: texturas.madeira });
      desenharObjeto(geometrias.tecido,
        criarMatrizModelo(m4, bandeira.tecido, [1, 1, 1], bandeira.rotacao),
        bandeira.cor, camera, { duplaFace: true, vento: 0.22, brilho: 5 });
    }
  }

  function desenharModelo(modelo, matrizRaiz, camera) {
    if (!modelo) return false;
    gl.useProgram(programaGLTF.program);
    const opacas = [], transparentes = [];
    for (const parte of modelo.drawables) {
      (parte.material.alphaMode === "BLEND" ? transparentes : opacas).push(parte);
    }
    // Desenha os materiais opacos primeiro e os transparentes por último.
    for (const [lista, transparente] of [[opacas, false], [transparentes, true]]) {
      if (transparente) {
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.depthMask(false);
      }
      for (const parte of lista) {
        const material = parte.material;
        if (material.doubleSided) gl.disable(gl.CULL_FACE);
        else gl.enable(gl.CULL_FACE);
        const modeloFinal = m4.multiply(matrizRaiz, parte.matrizNo);
        twgl.setBuffersAndAttributes(gl, programaGLTF, parte.bufferInfo);
        twgl.setUniforms(programaGLTF, {
          u_model: modeloFinal,
          u_normalMatrix: m4.transpose(m4.inverse(modeloFinal)),
          u_view: camera.view,
          u_projection: camera.projection,
          u_color: material.cor,
          u_baseColorTexture: material.textura || branco,
          u_useTexture: Boolean(material.textura),
          u_texScale: [1, 1],
          u_shininess: 14 + (1 - (material.roughness ?? 1)) * 65,
          u_specularStrength: 0.08 + (material.metallic ?? 0) * 0.42,
          u_alphaCutoff: material.alphaMode === "MASK" ? (material.alphaCutoff ?? 0.5) : 0,
          ...uniformsLuz(luz, camera),
        });
        twgl.drawBufferInfo(gl, parte.bufferInfo);
      }
      if (transparente) {
        gl.depthMask(true);
        gl.disable(gl.BLEND);
      }
    }
    gl.enable(gl.CULL_FACE);
    return true;
  }

  // Representações de emergência se algum arquivo GLB não estiver disponível.
  function desenharProvisorio(camera, matriz, ehLevi) {
    const pecas = ehLevi
      ? [
          [[0, 0.91, 0], [.36, .72, .29], [.25,.31,.26,1]],
          [[0, 1.51, 0], [.35,.34,.29], [.78,.66,.54,1]],
          [[0, 1.02, -.18], [.58,.8,.07], [.20,.37,.30,1]],
        ]
      : [
          [[0, 1.46, 0], [1.14, 1.9, .71], [.45,.33,.24,1]],
          [[0, 2.74, .1], [.76,.77,.68], [.68,.52,.36,1]],
          [[-.83, 1.45, .05], [.37, 1.2, .35], [.44,.31,.23,1]],
          [[.83, 1.45, .05], [.37, 1.2, .35], [.44,.31,.23,1]],
        ];
    for (const [pos, scale, cor] of pecas) {
      const local = criarMatrizModelo(m4, pos, scale);
      desenharObjeto(geometrias.cubo, m4.multiply(matriz, local), cor, camera);
    }
  }

  function desenharEspada(camera) {
    for (const parte of criarPartesEspada(m4, obterPose(levi))) {
      desenharObjeto(geometrias.cubo, parte.matriz, parte.cor, camera,
        { brilho: 90, especular: 0.70, textura: texturas.metal });
    }
  }

  function atualizarStatus(mensagem = "") {
    status.textContent = `Câmera ${cameraEstado.ativa} · Pose ${levi.poseAtual + 1}/3 · ` +
      `Luz ${luz.ligada ? "ligada" : "desligada"} · ` +
      `Neblina ${luz.neblina ? "ligada" : "desligada"}` +
      (mensagem ? ` · ${mensagem}` : "");
  }

  async function alternarSom() {
    try {
      const ligado = await audio.alternar();
      botaoSom.textContent = ligado ? "Som: ligado (M)" : "Ativar som (M)";
    } catch (erro) {
      console.error(erro);
      atualizarStatus("áudio indisponível");
    }
  }

  configurarEntrada(canvas, cameraEstado, {
    pose: () => { alternarPose(levi); atualizarStatus(); },
    camara: (numero) => { selecionarCamera(cameraEstado, numero); atualizarStatus(); },
    luz: () => { luz.ligada = !luz.ligada; atualizarStatus(); },
    neblina: () => { luz.neblina = !luz.neblina; atualizarStatus(); },
    audio: alternarSom,
    ajuda: () => { ui.hidden = !ui.hidden; },
    orbitar: (dx,dy) => orbitarCamera(cameraEstado, dx, dy),
    zoom: (dy) => aproximarCamera(cameraEstado, dy),
  });
  botaoSom.addEventListener("click", alternarSom);
  atualizarStatus();

  let tempo = 0;
  let anterior = 0;
  function quadro(agora) {
    const delta = anterior ? Math.min((agora - anterior) / 1000, 0.05) : 0;
    anterior = agora;
    tempo += delta;
    atualizarCamera(cameraEstado, delta);
    atualizarCanhao(canhao, delta);
    particulas.atualizar(delta, tempo);

    twgl.resizeCanvasToDisplaySize(canvas, window.devicePixelRatio || 1);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const camera = obterCamera(cameraEstado, canvas);
    ceu.desenhar(camera, tempo);

    desenharObjeto(geometrias.hemisferio, m4.identity(), [.63,.65,.67,1], camera,
      { textura: texturas.rocha, texScale: [5, 3], brilho: 8 });
    desenharObjeto(geometrias.disco, m4.identity(), [.84,.78,.66,1], camera,
      { textura: texturas.terra, texScale: [5,5], brilho: 9 });

    desenharLista(ruinas, geometrias.cubo, camera, texturas.pedra);
    desenharLista(destrocos, geometrias.esfera, camera, texturas.pedra);
    desenharLista(vigas, geometrias.cilindro, camera, texturas.madeira);
    desenharCanhao(camera);
    desenharBandeiras(camera);

    const matrizZeke = criarMatrizPersonagem(zeke, modeloZeke, twgl);
    const matrizLevi = criarMatrizPersonagem(levi, modeloLevi, twgl);
    if (!desenharModelo(modeloZeke, matrizZeke, camera)) desenharProvisorio(camera, matrizZeke, false);
    if (!desenharModelo(modeloLevi, matrizLevi, camera)) desenharProvisorio(camera, matrizLevi, true);
    desenharEspada(camera);

    renderizadorParticulas.desenhar(particulas, camera);
    requestAnimationFrame(quadro);
  }
  requestAnimationFrame(quadro);
}

main().catch((erro) => {
  console.error(erro);
  const aviso = document.createElement("pre");
  aviso.className = "erro";
  aviso.textContent = `Erro ao iniciar a cena:\n${erro.stack || erro.message}`;
  document.body.appendChild(aviso);
});
