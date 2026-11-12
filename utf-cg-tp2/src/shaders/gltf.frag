#version 300 es
precision highp float;

uniform vec4 u_color;
uniform sampler2D u_baseColorTexture;
uniform bool u_useTexture;

in vec2 v_texcoord;
out vec4 outColor;

void main() {
  vec4 cor = u_color;

  if (u_useTexture) {
    cor *= texture(u_baseColorTexture, v_texcoord);
  }

  outColor = cor;
}
