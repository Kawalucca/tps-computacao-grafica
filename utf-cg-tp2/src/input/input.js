// Controle de teclado da cena.
// A tecla P alterna entre as três posições definidas para Levi.

export function configurarEntrada(onAlternarPose) {
  function aoPressionar(evento) {
    if (evento.code !== "KeyP" || evento.repeat) {
      return;
    }

    evento.preventDefault();
    onAlternarPose();
  }

  window.addEventListener("keydown", aoPressionar);

  return function removerEntrada() {
    window.removeEventListener("keydown", aoPressionar);
  };
}
