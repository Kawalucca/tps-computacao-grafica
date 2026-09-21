import { localizarUniformes } from './gl.js'
import { modelo2D } from './matriz.js'

// Todo objeto do jogo (farol, barco, inimigos, projéteis, aviso do Kraken...)
// é um quadrado com textura. Este renderizador desenha qualquer um deles.
//
// Custo por sprite: 1 troca de textura (só se mudou) + 3 uniforms + 1 draw call.
// O que é feito UMA vez (ou uma vez por quadro), e não por sprite:
//   - criar o quad (VAO/VBO) e localizar os uniforms  -> construtor
//   - useProgram, bindVertexArray e enviar a projeção -> iniciarQuadro()

// Regiões/cores padrão, criadas uma vez e reaproveitadas (sem alocação por sprite)
const UV_IMAGEM_INTEIRA = new Float32Array([0, 0, 1, 1])
const COR_BRANCA = new Float32Array([1, 1, 1, 1])

/**
 * Quad unitário centrado na origem. Cada vértice: x, y, u, v.
 * A textura tem v = 0 no TOPO: imagens são gravadas de cima para baixo, então
 * assim elas aparecem na posição certa sem precisar inverter nada no upload.
 */
const VERTICES_QUAD = new Float32Array([
  -0.5,  0.5,  0, 0, // superior esquerdo
  -0.5, -0.5,  0, 1, // inferior esquerdo
   0.5, -0.5,  1, 1, // inferior direito
   0.5,  0.5,  1, 0  // superior direito
])

function criarQuad(gl) {
  const vao = gl.createVertexArray()
  gl.bindVertexArray(vao)

  const vbo = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
  // STATIC_DRAW: os dados são enviados uma vez e nunca mudam
  gl.bufferData(gl.ARRAY_BUFFER, VERTICES_QUAD, gl.STATIC_DRAW)

  const bytesPorFloat = 4
  const stride = 4 * bytesPorFloat // 4 floats por vértice (x, y, u, v)

  // slots 0 e 1 correspondem aos "layout(location = N)" do vertex shader
  gl.enableVertexAttribArray(0)
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, stride, 0)
  gl.enableVertexAttribArray(1)
  gl.vertexAttribPointer(1, 2, gl.FLOAT, false, stride, 2 * bytesPorFloat)

  gl.bindVertexArray(null)
  return vao
}

export class RenderizadorSprites {
  constructor(gl, programa) {
    this.gl = gl
    this.programa = programa
    this.uniformes = localizarUniformes(gl, programa, [
      'u_projecao', 'u_modelo', 'u_uv', 'u_cor', 'u_textura'
    ])
    this.vao = criarQuad(gl)
    this.modelo = new Float32Array(16) // reaproveitada a cada sprite
    this.texturaAtual = null

    // transparência da textura (aula 7): mistura o sprite com o que já está desenhado
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
  }

  /** Chame uma vez por quadro, antes de desenhar os sprites. */
  iniciarQuadro(projecao) {
    const gl = this.gl
    gl.useProgram(this.programa)
    gl.bindVertexArray(this.vao)
    gl.uniformMatrix4fv(this.uniformes.u_projecao, false, projecao)
    gl.uniform1i(this.uniformes.u_textura, 0) // o sampler lê da unidade de textura 0
    gl.activeTexture(gl.TEXTURE0)
    this.texturaAtual = null
  }

  /**
   * Desenha a textura inteira, centrada em (x, y) do mundo.
   * `rotacao` em radianos (anti-horária).
   */
  desenhar(textura, x, y, largura, altura, rotacao = 0) {
    this.desenharRegiao(textura, x, y, largura, altura, rotacao, UV_IMAGEM_INTEIRA, COR_BRANCA)
  }

  /**
   * Versão completa.
   *   uv:  [u0, v0, largura, altura] da região da textura (0..1, origem no topo esquerdo);
   *        serve para escolher um quadro de uma sprite sheet.
   *   cor: [r, g, b, a] multiplicada pela textura: tingir ou dar transparência.
   * Passe arrays criados uma única vez (não crie um novo a cada chamada).
   */
  desenharRegiao(textura, x, y, largura, altura, rotacao, uv, cor) {
    const gl = this.gl
    const u = this.uniformes

    // só troca a textura se for diferente da anterior (trocar é caro)
    if (textura.textura !== this.texturaAtual) {
      gl.bindTexture(gl.TEXTURE_2D, textura.textura)
      this.texturaAtual = textura.textura
    }

    modelo2D(this.modelo, x, y, largura, altura, rotacao)
    gl.uniformMatrix4fv(u.u_modelo, false, this.modelo)
    gl.uniform4fv(u.u_uv, uv)
    gl.uniform4fv(u.u_cor, cor)
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4)
  }
}
