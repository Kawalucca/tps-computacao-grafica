#version 300 es
in vec3 a_position;
in vec3 a_normal;
in vec2 a_texcoord;
uniform mat4 u_model;
uniform mat4 u_normalMatrix;
uniform mat4 u_view;
uniform mat4 u_projection;
uniform vec2 u_texScale;
uniform float u_time;
uniform float u_windStrength;
out vec3 v_normal;
out vec3 v_worldPos;
out vec2 v_texcoord;
void main() {
  vec3 local = a_position;
  // Apenas bandeiras recebem ondulação; os outros sólidos usam intensidade zero.
  local.z += sin(u_time * 2.7 + a_position.x * 4.6) * u_windStrength * max(a_position.x, 0.0);
  vec4 mundo = u_model * vec4(local, 1.0);
  v_worldPos = mundo.xyz;
  v_normal = normalize(mat3(u_normalMatrix) * a_normal);
  v_texcoord = a_texcoord * u_texScale;
  gl_Position = u_projection * u_view * mundo;
}
