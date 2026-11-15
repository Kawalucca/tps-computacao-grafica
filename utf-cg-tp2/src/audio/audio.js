// Ambiente de vento sintetizado. Não exige arquivos ou músicas de terceiros.
// O navegador só libera o som após uma interação explícita do usuário (tecla M).
export function criarAudioAmbiente() {
  let contexto = null;
  let fonte = null;
  let ganho = null;
  let ligado = false;

  async function alternar() {
    if (!contexto) {
      const Construtor = window.AudioContext || window.webkitAudioContext;
      if (!Construtor) {
        throw new Error("Web Audio API não está disponível.");
      }
      contexto = new Construtor();

      const segundos = 3;
      const taxa = contexto.sampleRate;
      const buffer = contexto.createBuffer(1, segundos * taxa, taxa);
      const dados = buffer.getChannelData(0);
      let filtrado = 0;
      for (let i = 0; i < dados.length; i++) {
        // Ruído passa-baixa: efeito de vento, sem usar recursos com direitos autorais.
        filtrado = filtrado * 0.985 + (Math.random() * 2 - 1) * 0.015;
        dados[i] = filtrado * 1.6;
      }
      fonte = contexto.createBufferSource();
      fonte.buffer = buffer;
      fonte.loop = true;

      const filtro = contexto.createBiquadFilter();
      filtro.type = "lowpass";
      filtro.frequency.value = 440;

      ganho = contexto.createGain();
      ganho.gain.value = 0;
      fonte.connect(filtro).connect(ganho).connect(contexto.destination);
      fonte.start();
    }

    await contexto.resume();
    ligado = !ligado;
    ganho.gain.setTargetAtTime(ligado ? 0.22 : 0, contexto.currentTime, 0.4);
    return ligado;
  }

  return { alternar, get ligado() { return ligado; } };
}
