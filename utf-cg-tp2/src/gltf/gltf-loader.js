// Carregador próprio de um subconjunto do glTF 2.0.
// Suporta GLB e glTF com buffers externos, hierarquia de nós,
// primitivas triangulares, fator de cor e textura baseColor.
// Não implementa skinning, animações, morph targets ou extensões de compressão.

const TIPOS_COMPONENTE = {
  5120: { tamanho: 1, ler: (view, offset) => view.getInt8(offset), tipo: Int8Array },
  5121: { tamanho: 1, ler: (view, offset) => view.getUint8(offset), tipo: Uint8Array },
  5122: { tamanho: 2, ler: (view, offset) => view.getInt16(offset, true), tipo: Int16Array },
  5123: { tamanho: 2, ler: (view, offset) => view.getUint16(offset, true), tipo: Uint16Array },
  5125: { tamanho: 4, ler: (view, offset) => view.getUint32(offset, true), tipo: Uint32Array },
  5126: { tamanho: 4, ler: (view, offset) => view.getFloat32(offset, true), tipo: Float32Array },
};

const QUANTIDADE_COMPONENTES = {
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
  MAT2: 4,
  MAT3: 9,
  MAT4: 16,
};

function lerTextoJSON(bytes) {
  const texto = new TextDecoder().decode(bytes).replace(/\u0000+$/g, "").trim();
  return JSON.parse(texto);
}

export function decodificarGLB(arrayBuffer) {
  const view = new DataView(arrayBuffer);

  if (view.byteLength < 20 || view.getUint32(0, true) !== 0x46546c67) {
    throw new Error("Arquivo GLB inválido: cabeçalho glTF não encontrado.");
  }

  const versao = view.getUint32(4, true);
  const tamanhoDeclarado = view.getUint32(8, true);

  if (versao !== 2) {
    throw new Error(`Versão GLB não suportada: ${versao}. É necessário glTF 2.0.`);
  }

  if (tamanhoDeclarado > view.byteLength) {
    throw new Error("Arquivo GLB incompleto: tamanho declarado maior que o arquivo.");
  }

  let json = null;
  let bin = null;
  let offset = 12;

  while (offset + 8 <= tamanhoDeclarado) {
    const tamanhoChunk = view.getUint32(offset, true);
    const tipoChunk = view.getUint32(offset + 4, true);
    const inicio = offset + 8;
    const fim = inicio + tamanhoChunk;

    if (fim > tamanhoDeclarado) {
      throw new Error("Arquivo GLB inválido: chunk ultrapassa o tamanho do arquivo.");
    }

    const dados = new Uint8Array(arrayBuffer, inicio, tamanhoChunk);

    if (tipoChunk === 0x4e4f534a) {
      json = lerTextoJSON(dados);
    } else if (tipoChunk === 0x004e4942) {
      bin = arrayBuffer.slice(inicio, fim);
    }

    offset = fim;
  }

  if (!json) {
    throw new Error("Arquivo GLB não contém o chunk JSON obrigatório.");
  }

  return { json, bin };
}

async function carregarDocumento(url) {
  const resposta = await fetch(url);

  if (!resposta.ok) {
    throw new Error(`Falha ao carregar ${url}: HTTP ${resposta.status}.`);
  }

  const dados = await resposta.arrayBuffer();
  const assinatura = new Uint8Array(dados, 0, Math.min(4, dados.byteLength));
  const ehGLB = assinatura.length === 4 &&
    assinatura[0] === 0x67 && assinatura[1] === 0x6c &&
    assinatura[2] === 0x54 && assinatura[3] === 0x46;

  if (ehGLB) {
    return decodificarGLB(dados);
  }

  return { json: JSON.parse(new TextDecoder().decode(dados)), bin: null };
}

async function carregarBuffers(documento, urlBase) {
  const definicoes = documento.json.buffers || [];
  const buffers = [];

  for (let i = 0; i < definicoes.length; i++) {
    const definicao = definicoes[i];

    if (definicao.uri) {
      const endereco = definicao.uri.startsWith("data:")
        ? definicao.uri
        : new URL(definicao.uri, urlBase).href;
      const resposta = await fetch(endereco);

      if (!resposta.ok) {
        throw new Error(`Falha ao carregar o buffer ${endereco}.`);
      }

      buffers.push(await resposta.arrayBuffer());
    } else if (i === 0 && documento.bin) {
      buffers.push(documento.bin);
    } else {
      throw new Error(`O buffer ${i} não possui URI nem dados BIN associados.`);
    }
  }

  return buffers;
}

function normalizarValor(valor, componente) {
  if (componente === 5120) return Math.max(valor / 127, -1);
  if (componente === 5121) return valor / 255;
  if (componente === 5122) return Math.max(valor / 32767, -1);
  if (componente === 5123) return valor / 65535;
  if (componente === 5125) return valor / 4294967295;
  return valor;
}

function lerAccessor(gltf, buffers, indice, comoFloat = true) {
  const accessor = gltf.accessors?.[indice];

  if (!accessor) {
    throw new Error(`Accessor ${indice} não encontrado.`);
  }

  if (accessor.sparse) {
    throw new Error("Este carregador ainda não suporta accessors sparse.");
  }

  if (accessor.bufferView === undefined) {
    throw new Error("Accessor sem bufferView não é suportado nesta versão.");
  }

  const info = TIPOS_COMPONENTE[accessor.componentType];
  const componentes = QUANTIDADE_COMPONENTES[accessor.type];

  if (!info || !componentes) {
    throw new Error(`Tipo de accessor não suportado: ${accessor.type}/${accessor.componentType}.`);
  }

  const bufferView = gltf.bufferViews[accessor.bufferView];

  if (!bufferView) {
    throw new Error(`BufferView ausente no accessor ${indice}.`);
  }

  const buffer = buffers[bufferView.buffer];

  if (!buffer) {
    throw new Error(`BufferView ou buffer ausente no accessor ${indice}.`);
  }

  const quantidade = accessor.count;
  const tamanhoElemento = info.tamanho * componentes;
  const stride = bufferView.byteStride || tamanhoElemento;
  const inicio = (bufferView.byteOffset || 0) + (accessor.byteOffset || 0);
  const dados = new DataView(buffer);
  const valores = comoFloat ? new Float32Array(quantidade * componentes) : new info.tipo(quantidade * componentes);

  for (let i = 0; i < quantidade; i++) {
    for (let c = 0; c < componentes; c++) {
      const offset = inicio + i * stride + c * info.tamanho;
      let valor = info.ler(dados, offset);

      if (comoFloat && accessor.normalized && accessor.componentType !== 5126) {
        valor = normalizarValor(valor, accessor.componentType);
      }

      valores[i * componentes + c] = valor;
    }
  }

  return { valores, componentes, quantidade, componentType: accessor.componentType };
}

function lerIndices(gltf, buffers, indice, quantidadeVertices) {
  if (indice === undefined) {
    const Tipo = quantidadeVertices > 65535 ? Uint32Array : Uint16Array;
    return new Tipo(Array.from({ length: quantidadeVertices }, (_, i) => i));
  }

  const resultado = lerAccessor(gltf, buffers, indice, false);

  if (resultado.componentes !== 1 || ![5121, 5123, 5125].includes(resultado.componentType)) {
    throw new Error("Os índices da malha devem usar SCALAR com UNSIGNED_BYTE, UNSIGNED_SHORT ou UNSIGNED_INT.");
  }

  return resultado.valores;
}

function matrizQuaternion(quaternion) {
  const [x, y, z, w] = quaternion;
  const x2 = x + x;
  const y2 = y + y;
  const z2 = z + z;
  const xx = x * x2;
  const xy = x * y2;
  const xz = x * z2;
  const yy = y * y2;
  const yz = y * z2;
  const zz = z * z2;
  const wx = w * x2;
  const wy = w * y2;
  const wz = w * z2;

  return [
    1 - (yy + zz), xy + wz, xz - wy, 0,
    xy - wz, 1 - (xx + zz), yz + wx, 0,
    xz + wy, yz - wx, 1 - (xx + yy), 0,
    0, 0, 0, 1,
  ];
}

function matrizLocalNo(no, m4) {
  if (no.matrix) {
    return new Float32Array(no.matrix);
  }

  const translacao = m4.translation(no.translation || [0, 0, 0]);
  const rotacao = matrizQuaternion(no.rotation || [0, 0, 0, 1]);
  const escala = m4.scaling(no.scale || [1, 1, 1]);

  return m4.multiply(translacao, m4.multiply(rotacao, escala));
}

function transformarPonto(matriz, x, y, z) {
  const px = matriz[0] * x + matriz[4] * y + matriz[8] * z + matriz[12];
  const py = matriz[1] * x + matriz[5] * y + matriz[9] * z + matriz[13];
  const pz = matriz[2] * x + matriz[6] * y + matriz[10] * z + matriz[14];
  const pw = matriz[3] * x + matriz[7] * y + matriz[11] * z + matriz[15];

  return pw !== 0 && pw !== 1 ? [px / pw, py / pw, pz / pw] : [px, py, pz];
}

async function carregarImagem(definicao, gltf, buffers, urlBase) {
  let blob;

  if (definicao.uri) {
    const endereco = definicao.uri.startsWith("data:")
      ? definicao.uri
      : new URL(definicao.uri, urlBase).href;
    const resposta = await fetch(endereco);

    if (!resposta.ok) {
      throw new Error(`Falha ao carregar imagem ${endereco}.`);
    }

    blob = await resposta.blob();
  } else if (definicao.bufferView !== undefined) {
    const view = gltf.bufferViews[definicao.bufferView];
    const buffer = buffers[view.buffer];
    const inicio = view.byteOffset || 0;
    const fim = inicio + view.byteLength;
    blob = new Blob([buffer.slice(inicio, fim)], {
      type: definicao.mimeType || "image/png",
    });
  } else {
    throw new Error("Imagem glTF sem URI ou bufferView.");
  }

  if (typeof createImageBitmap === "function") {
    return createImageBitmap(blob);
  }

  return new Promise((resolve, reject) => {
    const imagem = new Image();
    const enderecoTemporario = URL.createObjectURL(blob);
    imagem.onload = () => {
      URL.revokeObjectURL(enderecoTemporario);
      resolve(imagem);
    };
    imagem.onerror = () => {
      URL.revokeObjectURL(enderecoTemporario);
      reject(new Error("Não foi possível decodificar uma imagem do modelo."));
    };
    imagem.src = enderecoTemporario;
  });
}

function configurarTextura(gl, imagem, sampler = {}) {
  const textura = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, textura);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imagem);

  const mapaWrap = {
    10497: gl.REPEAT,
    33071: gl.CLAMP_TO_EDGE,
    33648: gl.MIRRORED_REPEAT,
  };

  const mapaFiltro = {
    9728: gl.NEAREST,
    9729: gl.LINEAR,
    9984: gl.NEAREST_MIPMAP_NEAREST,
    9985: gl.LINEAR_MIPMAP_NEAREST,
    9986: gl.NEAREST_MIPMAP_LINEAR,
    9987: gl.LINEAR_MIPMAP_LINEAR,
  };

  const filtroMin = sampler.minFilter || 9987;
  const usaMipMap = [9984, 9985, 9986, 9987].includes(filtroMin);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, mapaWrap[sampler.wrapS] || gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, mapaWrap[sampler.wrapT] || gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, mapaFiltro[sampler.magFilter || 9729]);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mapaFiltro[filtroMin]);

  if (usaMipMap) {
    gl.generateMipmap(gl.TEXTURE_2D);
  }

  gl.bindTexture(gl.TEXTURE_2D, null);
  if (typeof imagem.close === "function") imagem.close();

  return textura;
}

async function carregarTexturas(gl, gltf, buffers, urlBase) {
  const imagens = [];
  const texturas = [];

  for (const definicao of gltf.images || []) {
    imagens.push(await carregarImagem(definicao, gltf, buffers, urlBase));
  }

  for (const definicao of gltf.textures || []) {
    const imagem = imagens[definicao.source];

    if (!imagem) {
      texturas.push(null);
      continue;
    }

    const sampler = definicao.sampler !== undefined
      ? gltf.samplers?.[definicao.sampler] || {}
      : {};

    texturas.push(configurarTextura(gl, imagem, sampler));
  }

  return texturas;
}

function criarMateriais(gltf, texturas) {
  return (gltf.materials || []).map((material) => {
    const pbr = material.pbrMetallicRoughness || {};
    const infoTextura = pbr.baseColorTexture;

    if (infoTextura && infoTextura.texCoord !== undefined && infoTextura.texCoord !== 0) {
      console.warn("Este carregador utiliza somente TEXCOORD_0; outra coordenada foi ignorada.");
    }

    return {
      cor: pbr.baseColorFactor || [1, 1, 1, 1],
      textura: infoTextura ? texturas[infoTextura.index] || null : null,
      doubleSided: Boolean(material.doubleSided),
      alphaMode: material.alphaMode || "OPAQUE",
    };
  });
}

function criarPrimitivas(gl, twgl, gltf, buffers, materiais) {
  return (gltf.meshes || []).map((malha) => {
    return (malha.primitives || []).map((primitiva) => {
      if ((primitiva.mode ?? 4) !== 4) {
        throw new Error("Esta versão do carregador aceita somente primitivas TRIANGLES.");
      }

      if (primitiva.extensions?.KHR_draco_mesh_compression ||
          primitiva.extensions?.EXT_meshopt_compression) {
        throw new Error("O modelo usa geometria comprimida (Draco/Meshopt), ainda não suportada.");
      }

      const indicePosicao = primitiva.attributes?.POSITION;

      if (indicePosicao === undefined) {
        throw new Error("Uma primitiva do modelo não possui o atributo POSITION.");
      }

      const posicao = lerAccessor(gltf, buffers, indicePosicao, true);

      if (posicao.componentes !== 3) {
        throw new Error("O atributo POSITION precisa ser VEC3.");
      }

      let uv = new Float32Array(posicao.quantidade * 2);
      if (primitiva.attributes.TEXCOORD_0 !== undefined) {
        const coordenadas = lerAccessor(gltf, buffers, primitiva.attributes.TEXCOORD_0, true);
        if (coordenadas.componentes !== 2) {
          throw new Error("TEXCOORD_0 precisa ser VEC2.");
        }
        uv = coordenadas.valores;
      }

      const indices = lerIndices(gltf, buffers, primitiva.indices, posicao.quantidade);
      const bufferInfo = twgl.createBufferInfoFromArrays(gl, {
        position: { numComponents: 3, data: posicao.valores },
        texcoord: { numComponents: 2, data: uv },
        indices,
      });

      const material = primitiva.material !== undefined
        ? materiais[primitiva.material] || { cor: [1, 1, 1, 1], textura: null, doubleSided: false, alphaMode: "OPAQUE" }
        : { cor: [1, 1, 1, 1], textura: null, doubleSided: false, alphaMode: "OPAQUE" };

      return {
        bufferInfo,
        material,
        posicoes: posicao.valores,
      };
    });
  });
}

function calcularLimites(drawables, m4) {
  const minimo = [Infinity, Infinity, Infinity];
  const maximo = [-Infinity, -Infinity, -Infinity];
  let quantidade = 0;

  for (const item of drawables) {
    const posicoes = item.posicoes;

    for (let i = 0; i < posicoes.length; i += 3) {
      const ponto = transformarPonto(item.matrizNo, posicoes[i], posicoes[i + 1], posicoes[i + 2]);

      for (let eixo = 0; eixo < 3; eixo++) {
        minimo[eixo] = Math.min(minimo[eixo], ponto[eixo]);
        maximo[eixo] = Math.max(maximo[eixo], ponto[eixo]);
      }

      quantidade++;
    }
  }

  if (quantidade === 0) {
    throw new Error("O modelo não contém vértices renderizáveis.");
  }

  const centro = [
    (minimo[0] + maximo[0]) / 2,
    (minimo[1] + maximo[1]) / 2,
    (minimo[2] + maximo[2]) / 2,
  ];

  const altura = maximo[1] - minimo[1];

  return { minimo, maximo, centro, altura };
}

export async function carregarModeloGLTF(gl, twgl, url) {
  const endereco = new URL(url, document.baseURI).href;
  const documento = await carregarDocumento(endereco);
  const gltf = documento.json;

  if (gltf.asset?.version !== "2.0") {
    throw new Error("O modelo precisa estar no formato glTF 2.0.");
  }

  const buffers = await carregarBuffers(documento, endereco);
  const texturas = await carregarTexturas(gl, gltf, buffers, endereco);
  const materiais = criarMateriais(gltf, texturas);
  const primitivas = criarPrimitivas(gl, twgl, gltf, buffers, materiais);
  const drawables = [];
  const avisos = [];

  if (gltf.skins?.length) {
    avisos.push("O modelo possui skinning. A malha será exibida sem deformação esquelética nesta etapa.");
  }
  if (gltf.animations?.length) {
    avisos.push("O modelo possui animações. Os clipes ainda não são executados nesta etapa.");
  }
  if (gltf.extensionsRequired?.length) {
    avisos.push(`Extensões obrigatórias declaradas: ${gltf.extensionsRequired.join(", ")}.`);
  }

  const cena = gltf.scenes?.[gltf.scene ?? 0];
  let raizes = cena?.nodes;

  if (!raizes) {
    const filhos = new Set();
    for (const no of gltf.nodes || []) {
      for (const filho of no.children || []) filhos.add(filho);
    }
    raizes = (gltf.nodes || []).map((_, i) => i).filter((i) => !filhos.has(i));
  }

  const m4 = twgl.m4;
  const caminho = new Set();

  function visitarNo(indiceNo, matrizPai) {
    if (caminho.has(indiceNo)) {
      throw new Error("Hierarquia inválida: ciclo encontrado nos nós do glTF.");
    }

    const no = gltf.nodes[indiceNo];
    if (!no) throw new Error(`Nó ${indiceNo} não encontrado no modelo.`);

    caminho.add(indiceNo);
    const matrizNo = m4.multiply(matrizPai, matrizLocalNo(no, m4));

    if (no.mesh !== undefined) {
      const primitivasDaMalha = primitivas[no.mesh] || [];

      for (const primitiva of primitivasDaMalha) {
        drawables.push({
          bufferInfo: primitiva.bufferInfo,
          material: primitiva.material,
          matrizNo: matrizNo,
          posicoes: primitiva.posicoes,
        });
      }
    }

    for (const filho of no.children || []) {
      visitarNo(filho, matrizNo);
    }

    caminho.delete(indiceNo);
  }

  for (const raiz of raizes || []) {
    visitarNo(raiz, m4.identity());
  }

  const limites = calcularLimites(drawables, m4);

  if (avisos.length) {
    console.warn(`Avisos do modelo ${url}:\n- ${avisos.join("\n- ")}`);
  }

  return {
    url,
    drawables,
    limites,
    avisos,
  };
}
