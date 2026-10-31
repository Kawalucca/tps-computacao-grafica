// Câmera 1 (automática a ~45º + scroll) e câmera 2 (orbital com mouse).
import * as twgl from "../lib/twgl-full.module.js";

const m4 = twgl.m4;

// Câmera fixa da etapa 1: elevada, olhando para o centro do diorama.
export function cameraFixa(canvas) {
  // A TWGL espera o ângulo em RADIANOS, não em graus.
  const fovY = (60 * Math.PI) / 180;
  const aspect = canvas.clientWidth / canvas.clientHeight; // sem isso a imagem estica ao redimensionar
  const projection = m4.perspective(fovY, aspect, 0.1, 100);

  const olho = [0, 6, 8];
  const alvo = [0, 0, 0];
  const cima = [0, 1, 0];
  // lookAt devolve a matriz da CÂMERA no mundo (onde ela está); a view é o contrário: leva o mundo para o referencial da câmera.
  const view = m4.inverse(m4.lookAt(olho, alvo, cima));

  return { projection, view };
}
