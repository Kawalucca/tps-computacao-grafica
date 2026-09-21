#version 300 es
// (a linha acima precisa ser a PRIMEIRA do arquivo, sem linha em branco antes)

// Vertex shader de sprites.
// Recebe um quadrado unitário (-0.5..0.5) e o posiciona no mundo usando a
// matriz de modelo (escala + rotação + translação). Serve para TODOS os sprites.

// "layout(location = N)" fixa o slot do atributo no próprio shader; assim o
// JavaScript não precisa chamar getAttribLocation (ver renderizador-sprites.js).
layout(location = 0) in vec2 a_posicao;   // canto do quad, em (-0.5..0.5)
layout(location = 1) in vec2 a_texcoord;  // (0,0) = canto superior esquerdo da imagem

uniform mat4 u_projecao;  // mundo -> tela (ortho), igual para o quadro inteiro
uniform mat4 u_modelo;    // quad unitário -> posição/tamanho/rotação no mundo
uniform vec4 u_uv;        // região da textura a usar: (u0, v0, largura, altura)

out vec2 v_texcoord;

void main() {
  // u_uv = (0, 0, 1, 1) usa a imagem inteira; para sprite sheets, escolhe um quadro
  v_texcoord = u_uv.xy + a_texcoord * u_uv.zw;
  gl_Position = u_projecao * u_modelo * vec4(a_posicao, 0.0, 1.0);
}
