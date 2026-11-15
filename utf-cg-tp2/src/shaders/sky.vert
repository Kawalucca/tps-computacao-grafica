#version 300 es
in vec3 a_position;
uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;
out vec3 v_direction;
void main() {
  v_direction = normalize(a_position);
  gl_Position = u_projection * u_view * u_model * vec4(a_position, 1.0);
}
