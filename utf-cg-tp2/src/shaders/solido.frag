#version 300 es
precision highp float;

// Cor única para a peça inteira; iluminação e textura entram nas próximas etapas.
uniform vec4 u_color;

out vec4 outColor;

void main() {
  outColor = u_color;
}
