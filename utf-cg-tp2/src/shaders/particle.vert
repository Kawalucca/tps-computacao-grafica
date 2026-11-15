#version 300 es
in vec2 a_position;
uniform mat4 u_view;
uniform mat4 u_projection;
uniform vec3 u_position;
uniform float u_size;
out vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  // Transforma o centro para o espaço da câmera, e expande o quad nesse plano.
  vec4 centro = u_view * vec4(u_position, 1.0);
  vec4 vertice = centro + vec4(a_position * u_size, 0.0, 0.0);
  gl_Position = u_projection * vertice;
}
