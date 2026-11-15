#version 300 es
precision highp float;
in vec3 v_direction;
uniform float u_time;
out vec4 outColor;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i), b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
void main() {
  vec3 dir = normalize(v_direction);
  float y = clamp(dir.y * 0.5 + 0.5, 0.0, 1.0);
  vec3 horizonte = vec3(0.40, 0.42, 0.44);
  vec3 topo = vec3(0.075, 0.105, 0.17);
  vec3 cor = mix(horizonte, topo, smoothstep(0.11, 0.94, y));
  vec2 uv = vec2(atan(dir.z, dir.x) * 1.35, dir.y * 3.0);
  uv.x += u_time * 0.008;
  float n1 = noise(uv * 3.4), n2 = noise(uv * 7.3) * 0.38;
  float nuvem = smoothstep(0.48, 0.78, n1 + n2 * 0.35) * (0.65 + 0.35 * (1.0 - y));
  cor = mix(cor, vec3(0.29, 0.32, 0.36), nuvem * 0.73);
  outColor = vec4(cor, 1.0);
}
