// Carregamento de imagens e criação de texturas (aula 7).

/** Baixa uma imagem e só devolve quando ela estiver pronta para uso. */
async function carregarImagem(url) {
  const imagem = new Image()
  imagem.src = url
  try {
    await imagem.decode() // espera baixar E decodificar
  } catch {
    throw new Error(`Não foi possível carregar a imagem "${url}"`)
  }
  return imagem
}

/**
 * Sobe uma imagem para a GPU como textura.
 *
 * Opções:
 *   suave  (padrão true)   LINEAR (suave) ou NEAREST (pixels "quadradões", estilo pixel art)
 *   mipmap (padrão false)  gera versões reduzidas da imagem. Boa para fundos que
 *                          aparecem menores que o original; ruim para sprite sheets,
 *                          porque os quadros vizinhos "vazam" uns nos outros ao reduzir.
 *
 * Devolve { textura, largura, altura } (tamanho da imagem em pixels).
 */
function criarTextura(gl, imagem, { suave = true, mipmap = false } = {}) {
  const textura = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, textura)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imagem)

  let filtroReducao = suave ? gl.LINEAR : gl.NEAREST
  if (mipmap) {
    gl.generateMipmap(gl.TEXTURE_2D)
    filtroReducao = suave ? gl.LINEAR_MIPMAP_LINEAR : gl.NEAREST_MIPMAP_NEAREST
  }
  // ATENÇÃO: o filtro de redução padrão exige mipmaps. Sem definir um filtro
  // aqui, uma textura sem mipmap fica "incompleta" e aparece PRETA.
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filtroReducao)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, suave ? gl.LINEAR : gl.NEAREST)

  // sem repetir: nas bordas, usa o último pixel (evita linhas no contorno dos sprites)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

  gl.bindTexture(gl.TEXTURE_2D, null)
  return { textura, largura: imagem.naturalWidth, altura: imagem.naturalHeight }
}

/**
 * Textura de 1 pixel branco: desenhada com o renderizador de sprites e tingida
 * por `cor`, vira um retângulo sólido de qualquer cor (ex.: barras de vida).
 */
export function criarTexturaBranca(gl) {
  const textura = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, textura)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]))
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.bindTexture(gl.TEXTURE_2D, null)
  return { textura, largura: 1, altura: 1 }
}

/** Carrega uma imagem e já a transforma em textura. */
export async function carregarTextura(gl, url, opcoes) {
  const imagem = await carregarImagem(url)
  return criarTextura(gl, imagem, opcoes)
}
