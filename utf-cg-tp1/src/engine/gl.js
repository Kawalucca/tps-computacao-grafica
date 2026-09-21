// Utilitários de WebGL: contexto, shaders em arquivos .glsl e programa (aula 6).

/** Cria o contexto WebGL2 ou lança um erro se o navegador não suportar. */
export function criarContexto(canvas) {
  const gl = canvas.getContext('webgl2', {
    alpha: false,     // o canvas nunca é transparente: o navegador não precisa misturá-lo com a página
    antialias: false  // MSAA suaviza bordas de polígonos; nossos sprites são quadrados com textura, só custaria
  })
  if (!gl) {
    throw new Error('WebGL 2 não suportado')
  }
  return gl
}

/** Baixa um arquivo de texto (assíncrono!). */
async function carregarTexto(url) {
  const resposta = await fetch(url)
  if (!resposta.ok) {
    throw new Error(`Não foi possível baixar "${url}" (HTTP ${resposta.status})`)
  }
  return resposta.text()
}

function compilarShader(gl, tipo, codigo, nome) {
  const shader = gl.createShader(tipo)
  gl.shaderSource(shader, codigo)
  gl.compileShader(shader)

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader)
    gl.deleteShader(shader)
    throw new Error(`Erro ao compilar "${nome}":\n${log}`)
  }
  return shader
}

/**
 * Baixa os dois arquivos .glsl, compila e linka o programa.
 * Os dois downloads acontecem em paralelo (Promise.all).
 */
export async function carregarPrograma(gl, urlVertex, urlFragment) {
  const [codigoVertex, codigoFragment] = await Promise.all([
    carregarTexto(urlVertex),
    carregarTexto(urlFragment)
  ])

  const vertex = compilarShader(gl, gl.VERTEX_SHADER, codigoVertex, urlVertex)
  const fragment = compilarShader(gl, gl.FRAGMENT_SHADER, codigoFragment, urlFragment)

  const programa = gl.createProgram()
  gl.attachShader(programa, vertex)
  gl.attachShader(programa, fragment)
  gl.linkProgram(programa)

  if (!gl.getProgramParameter(programa, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(programa)
    gl.deleteProgram(programa)
    throw new Error(`Erro ao linkar o programa:\n${log}`)
  }

  // depois do link, os objetos shader individuais não são mais necessários
  gl.deleteShader(vertex)
  gl.deleteShader(fragment)
  return programa
}

/**
 * Descobre a localização de vários uniforms de uma vez.
 * Deve ser chamada UMA vez, na inicialização: perguntar a localização
 * (getUniformLocation) é lento demais para fazer a cada quadro ou sprite.
 */
export function localizarUniformes(gl, programa, nomes) {
  const localizacoes = {}
  for (const nome of nomes) {
    const localizacao = gl.getUniformLocation(programa, nome)
    if (localizacao === null) {
      console.warn(`Uniform "${nome}" não encontrado (o shader não o usa ou o nome está errado)`)
    }
    localizacoes[nome] = localizacao
  }
  return localizacoes
}
