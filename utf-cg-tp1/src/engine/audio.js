// Áudio do jogo: efeitos curtos (arquivos .wav, carregados uma vez e
// tocados várias vezes) e uma música de fundo SINTETIZADA AO VIVO com
// osciladores do Web Audio, em vez de um arquivo — assim nunca temos o
// problema clássico de "costura" perceptível no ponto onde um arquivo de
// música dá loop.
//
// Navegadores bloqueiam qualquer som até a primeira interação do jogador
// (clique, tecla, toque) — é política de todo navegador, não um bug nosso.
// Por isso o AudioContext só é criado/retomado dentro de destravarAudio(),
// chamada no primeiro clique dentro do jogo (ver main.js).

let contexto = null
let volumeMestre = null
let musicaIniciada = false

/** Cria (uma vez) e retoma o AudioContext. Chame na primeira interação do jogador. */
export function destravarAudio() {
  if (!contexto) {
    contexto = new (window.AudioContext || window.webkitAudioContext)()
    volumeMestre = contexto.createGain()
    volumeMestre.gain.value = 0.5
    volumeMestre.connect(contexto.destination)
  }
  if (contexto.state === 'suspended') contexto.resume()
  return contexto
}

/**
 * Baixa e decodifica um efeito sonoro. Pode ser chamado ANTES de
 * destravarAudio() (o carregamento em si não é bloqueado pela política de
 * autoplay — só a REPRODUÇÃO é), então cria um contexto temporário se
 * ainda não existir nenhum.
 */
export async function carregarSom(url) {
  const ctx = contexto || new (window.AudioContext || window.webkitAudioContext)()
  const resposta = await fetch(url)
  const bytes = await resposta.arrayBuffer()
  return ctx.decodeAudioData(bytes)
}

/**
 * Toca um efeito já carregado (o buffer devolvido por carregarSom), uma vez,
 * sem loop. Não faz nada (em silêncio) se o áudio ainda estiver travado —
 * evita erro se algum som tentar tocar antes do primeiro clique do jogador.
 */
export function tocarEfeito(buffer, { volume = 1, variacaoPitch = 0 } = {}) {
  if (!contexto || contexto.state !== 'running') return

  const fonte = contexto.createBufferSource()
  fonte.buffer = buffer
  if (variacaoPitch > 0) {
    // pequena variação aleatória de velocidade/pitch a cada tiro/impacto,
    // para não soar "metralhadora" tocando exatamente o mesmo som sem parar
    fonte.playbackRate.value = 1 + (Math.random() * 2 - 1) * variacaoPitch
  }

  const ganho = contexto.createGain()
  ganho.gain.value = volume
  fonte.connect(ganho)
  ganho.connect(volumeMestre)
  fonte.start()
}

/**
 * Música de fundo: 3 osciladores tocando um acorde simples e sustentado,
 * cada um com um LFO lento de volume (para "respirar" em vez de ficar
 * estático). Chamar só uma vez — chamadas repetidas são ignoradas.
 */
export function iniciarMusicaFundo() {
  if (musicaIniciada || !contexto) return
  musicaIniciada = true

  const ganhoMusica = contexto.createGain()
  ganhoMusica.gain.value = 0.1 // ainda discreto, mas audível em alto-falantes de notebook
  ganhoMusica.connect(volumeMestre)

  const NOTAS = [196, 246.94, 293.66] // sol3, si3, ré4 — mesmo acorde, uma oitava acima (fica mais audível em alto-falantes pequenos, que reproduzem mal graves)
  for (let i = 0; i < NOTAS.length; i++) {
    const osc = contexto.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = NOTAS[i]

    const lfo = contexto.createOscillator()
    lfo.frequency.value = 0.05 + i * 0.02 // cada nota "respira" num ritmo levemente diferente
    const profundidadeLfo = contexto.createGain()
    profundidadeLfo.gain.value = 0.5

    const ganhoNota = contexto.createGain()
    ganhoNota.gain.value = 0.5

    lfo.connect(profundidadeLfo)
    profundidadeLfo.connect(ganhoNota.gain)
    osc.connect(ganhoNota)
    ganhoNota.connect(ganhoMusica)

    osc.start()
    lfo.start()
  }
}