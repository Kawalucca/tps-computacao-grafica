#version 300 es
// (a linha acima precisa ser a PRIMEIRA do arquivo, sem linha em branco antes)

// Fragment shader de sprites: cor do pixel = cor da textura × u_cor.
//   u_cor = (1, 1, 1, 1)  -> textura original
//   u_cor = (1, 0.4, 0.4, 1) -> textura "tingida" de vermelho (ex.: efeito de dano)
//   u_cor = (1, 1, 1, 0.5)   -> textura com 50% de opacidade (ex.: aviso do Kraken)

precision highp float;

in vec2 v_texcoord;

uniform sampler2D u_textura;  // unidade de textura 0
uniform vec4 u_cor;

out vec4 saida;

void main() {
  saida = texture(u_textura, v_texcoord) * u_cor;
}
