// Controles do teclado e do mouse, sem bibliotecas externas.
export function configurarEntrada(canvas, camera, callbacks) {
  let arrastando = false;
  let anteriorX = 0;
  let anteriorY = 0;

  function teclado(evento) {
    if (evento.repeat) return;
    switch (evento.code) {
      case "Digit1": callbacks.camara(1); break;
      case "Digit2": callbacks.camara(2); break;
      case "KeyP": callbacks.pose(); break;
      case "KeyL": callbacks.luz(); break;
      case "KeyN": callbacks.neblina(); break;
      case "KeyM": callbacks.audio(); break;
      case "KeyH": callbacks.ajuda(); break;
      default: return;
    }
    evento.preventDefault();
  }

  function iniciarArrasto(evento) {
    if (evento.button !== 0 || camera.ativa !== 2) return;
    arrastando = true;
    anteriorX = evento.clientX;
    anteriorY = evento.clientY;
    canvas.setPointerCapture?.(evento.pointerId);
  }

  function movimentarMouse(evento) {
    if (!arrastando) return;
    callbacks.orbitar(evento.clientX - anteriorX, evento.clientY - anteriorY);
    anteriorX = evento.clientX;
    anteriorY = evento.clientY;
  }

  function pararArrasto() { arrastando = false; }

  function rodarMouse(evento) {
    evento.preventDefault();
    callbacks.zoom(evento.deltaY);
  }

  window.addEventListener("keydown", teclado);
  canvas.addEventListener("pointerdown", iniciarArrasto);
  canvas.addEventListener("pointermove", movimentarMouse);
  canvas.addEventListener("pointerup", pararArrasto);
  canvas.addEventListener("pointercancel", pararArrasto);
  canvas.addEventListener("wheel", rodarMouse, { passive: false });

  return () => {
    window.removeEventListener("keydown", teclado);
    canvas.removeEventListener("pointerdown", iniciarArrasto);
    canvas.removeEventListener("pointermove", movimentarMouse);
    canvas.removeEventListener("pointerup", pararArrasto);
    canvas.removeEventListener("pointercancel", pararArrasto);
    canvas.removeEventListener("wheel", rodarMouse);
  };
}
