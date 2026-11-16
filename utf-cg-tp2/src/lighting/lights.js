// Parâmetros compartilhados dos dois programas de shader: sólidos e glTF.
export function criarEstadoLuz() {
  return {
    ligada: true,
    neblina: true,
    direcao: [-0.45, 0.88, 0.36], // direção do objeto em direção à luz
    cor: [1.0, 0.87, 0.72],
    ambiente: [0.40, 0.41, 0.43],
    corNeblina: [0.65, 0.70, 0.65],
  };
}

export function uniformsLuz(estado, camera) {
  return {
    u_lightEnabled: estado.ligada,
    u_lightDirection: estado.direcao,
    u_lightColor: estado.cor,
    u_ambientColor: estado.ambiente,
    u_cameraPosition: camera.olho,
    u_fogEnabled: estado.neblina,
    u_fogColor: estado.corNeblina,
    u_fogNear: 14.0,
    u_fogFar: 31.0,
  };
}
