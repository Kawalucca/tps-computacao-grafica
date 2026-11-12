#version 300 es

in vec3 a_position;
in vec2 a_texcoord;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;

out vec2 v_texcoord;

void main() {
  v_texcoord = a_texcoord;
  gl_Position = u_projection * u_view * u_model * vec4(a_position, 1.0);
}
