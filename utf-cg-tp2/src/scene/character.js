// Estado e transformações dos personagens do diorama.
// As poses obrigatórias alteram posição e orientação do modelo inteiro.

export function criarEstadoPersonagem(poses, alturaAlvo) {
  return {
    poses,
    alturaAlvo,
    poseAtual: 0,
  };
}

export function alternarPose(personagem) {
  personagem.poseAtual = (personagem.poseAtual + 1) % personagem.poses.length;
  return personagem.poseAtual;
}

export function obterPose(personagem) {
  return personagem.poses[personagem.poseAtual];
}

export function criarMatrizPersonagem(personagem, modelo, twgl) {
  const m4 = twgl.m4;
  const pose = obterPose(personagem);

  // Se o arquivo ainda não foi colocado na pasta, usa uma escala provisória.
  const centro = modelo?.limites?.centro || [0, 0, 0];
  const alturaModelo = modelo?.limites?.altura || personagem.alturaAlvo;
  const escalaUniforme = personagem.alturaAlvo / Math.max(alturaModelo, 0.001);

  let matriz = m4.translation(pose.posicao);
  matriz = m4.multiply(matriz, m4.yRotation(pose.rotacao[1]));
  matriz = m4.multiply(matriz, m4.xRotation(pose.rotacao[0]));
  matriz = m4.multiply(matriz, m4.zRotation(pose.rotacao[2]));
  matriz = m4.multiply(matriz, m4.scaling([escalaUniforme, escalaUniforme, escalaUniforme]));

  // Centraliza a malha antes de posicioná-la no diorama.
  matriz = m4.multiply(matriz, m4.translation([
    -centro[0],
    -centro[1],
    -centro[2],
  ]));

  return matriz;
}
