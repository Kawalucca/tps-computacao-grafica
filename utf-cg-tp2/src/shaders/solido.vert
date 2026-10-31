#version 300 es
// Pipeline clássico: espaço do objeto -> mundo (model) -> câmera (view) -> tela (projection).
in vec3 a_position;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;

void main() {
  gl_Position = u_projection * u_view * u_model * vec4(a_position, 1.0);
}
