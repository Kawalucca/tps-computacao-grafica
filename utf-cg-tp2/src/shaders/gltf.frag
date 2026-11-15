#version 300 es
precision highp float;
in vec3 v_normal;
in vec3 v_worldPos;
in vec2 v_texcoord;
uniform vec4 u_color;
uniform sampler2D u_baseColorTexture;
uniform bool u_useTexture;
uniform bool u_lightEnabled;
uniform vec3 u_lightDirection;
uniform vec3 u_lightColor;
uniform vec3 u_ambientColor;
uniform vec3 u_cameraPosition;
uniform bool u_fogEnabled;
uniform vec3 u_fogColor;
uniform float u_fogNear;
uniform float u_fogFar;
uniform float u_shininess;
uniform float u_specularStrength;
uniform float u_alphaCutoff;
out vec4 outColor;
void main() {
  vec4 material = u_color;
  if (u_useTexture) material *= texture(u_baseColorTexture, v_texcoord);
  if (material.a < u_alphaCutoff) discard;
  vec3 cor = material.rgb;
  if (u_lightEnabled) {
    vec3 normal = normalize(v_normal);
    vec3 l = normalize(u_lightDirection);
    vec3 v = normalize(u_cameraPosition - v_worldPos);
    float difusa = max(dot(normal, l), 0.0);
    vec3 refletida = reflect(-l, normal);
    float especular = pow(max(dot(refletida, v), 0.0), max(u_shininess, 1.0));
    cor = cor * (u_ambientColor + difusa * u_lightColor * 0.76)
      + u_lightColor * especular * u_specularStrength * (difusa > 0.0 ? 1.0 : 0.0);
  }
  if (u_fogEnabled) {
    float distancia = distance(v_worldPos, u_cameraPosition);
    float fator = smoothstep(u_fogNear, u_fogFar, distancia);
    cor = mix(cor, u_fogColor, fator * 0.83);
  }
  outColor = vec4(cor, material.a);
}
