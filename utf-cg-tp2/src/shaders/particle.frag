#version 300 es
precision highp float;
in vec2 v_uv;
uniform float u_alpha;
uniform vec3 u_color;
out vec4 outColor;
void main() {
  float raio = length(v_uv * 2.0 - 1.0);
  float borda = 1.0 - smoothstep(0.02, 1.0, raio);
  float nuvem = borda * borda;
  outColor = vec4(u_color, u_alpha * nuvem);
}
