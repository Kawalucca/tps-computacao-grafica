// Vento sintetizado e música de fundo, iniciados por interação do usuário.
export function criarAudioAmbiente() {
  let contexto = null;
  let fonte = null;
  let ganho = null;
  let ligado = false;
  let ativacao = null;
  const musica = new Audio("assets/audio/abertura.mp3");
  musica.loop = true;
  musica.preload = "none";
  musica.volume = 0.35;

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

    if (ativacao) return ativacao;
    if (ligado) {
      musica.pause();
      ganho.gain.setTargetAtTime(0, contexto.currentTime, 0.4);
      ligado = false;
      return false;
    }

    // Ambos os pedidos são feitos durante a interação para respeitar as
    // políticas de reprodução automática dos navegadores.
    ativacao = (async () => {
      try {
        await Promise.all([contexto.resume(), musica.play()]);
        ganho.gain.setTargetAtTime(0.22, contexto.currentTime, 0.4);
        ligado = true;
        return true;
      } catch (erro) {
        musica.pause();
        ganho.gain.setTargetAtTime(0, contexto.currentTime, 0.4);
        throw erro;
      } finally {
        ativacao = null;
      }
    })();
    return ativacao;
  }

  return { alternar, get ligado() { return ligado; } };
}
