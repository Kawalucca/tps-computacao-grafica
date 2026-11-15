#version 300 es
precision highp float;
in vec2 v_uv;
uniform float u_alpha;
uniform bool u_dust;
out vec4 outColor;
void main() {
  float raio = length(v_uv * 2.0 - 1.0);
  float borda = 1.0 - smoothstep(0.02, 1.0, raio);
  float nuvem = borda * borda;
  vec3 cor = u_dust ? vec3(0.54, 0.43, 0.32) : vec3(0.74, 0.75, 0.76);
  outColor = vec4(cor, u_alpha * nuvem);
}
