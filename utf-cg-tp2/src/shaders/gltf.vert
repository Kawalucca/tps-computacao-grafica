#version 300 es
in vec3 a_position;
in vec3 a_normal;
in vec2 a_texcoord;
uniform mat4 u_model;
uniform mat4 u_normalMatrix;
uniform mat4 u_view;
uniform mat4 u_projection;
uniform vec2 u_texScale;
out vec3 v_normal;
out vec3 v_worldPos;
out vec2 v_texcoord;
void main() {
  vec4 mundo = u_model * vec4(a_position, 1.0);
  v_worldPos = mundo.xyz;
  v_normal = normalize(mat3(u_normalMatrix) * a_normal);
  v_texcoord = a_texcoord * u_texScale;
  gl_Position = u_projection * u_view * mundo;
}
