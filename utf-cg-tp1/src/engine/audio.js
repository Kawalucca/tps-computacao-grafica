// Áudio do jogo: efeitos curtos e música de fundo, ambos carregados de
// arquivo (.mp3) e decodificados pelo Web Audio — decodeAudioData não liga
// para o codec, então funciona igual para .wav, .mp3 ou .mp4/.m4a (áudio em
// container mp4/AAC), desde que o navegador saiba decodificar o formato.
//
// Navegadores bloqueiam qualquer som até a primeira interação do jogador
// (clique, tecla, toque) — é política de todo navegador, não um bug nosso.
// Por isso o AudioContext só é criado/retomado dentro de destravarAudio(),
// chamada no primeiro clique dentro do jogo (ver main.js).

// A música é a protagonista: todos os efeitos passam por um canal próprio,
// com volume menor, antes de chegar no volume mestre. Pra equilibrar
// efeitos x música, é só mexer neste número (não em cada tocarEfeito).
const VOLUME_EFEITOS = 0.65

let contexto = null
let volumeMestre = null
let volumeEfeitos = null
let musicaIniciada = false

/** Cria (uma vez) e retoma o AudioContext. Chame na primeira interação do jogador. */
export function destravarAudio() {
  if (!contexto) {
    contexto = new (window.AudioContext || window.webkitAudioContext)()
    volumeMestre = contexto.createGain()
    volumeMestre.gain.value = 0.5
    volumeMestre.connect(contexto.destination)
    volumeEfeitos = contexto.createGain()
    volumeEfeitos.gain.value = VOLUME_EFEITOS
    volumeEfeitos.connect(volumeMestre)
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
  if (!resposta.ok) {
    throw new Error(`Não foi possível baixar "${url}" (HTTP ${resposta.status})`)
  }
  const bytes = await resposta.arrayBuffer()
  return ctx.decodeAudioData(bytes)
}

/**
 * Como carregarSom, mas nunca lança erro: devolve `null` se o arquivo ainda
 * não existir (ex.: a trilha sonora, adicionada depois) ou não puder ser
 * decodificado, só avisando no console. Usada para qualquer som que não deve
 * travar o carregamento do jogo inteiro se estiver faltando.
 */
export async function carregarSomOpcional(url) {
  try {
    return await carregarSom(url)
  } catch (erro) {
    console.warn(`Áudio opcional "${url}" não carregado: ${erro.message}`)
    return null
  }
}

/**
 * Toca um efeito já carregado (o buffer devolvido por carregarSom), uma vez,
 * sem loop. Não faz nada (em silêncio) se o áudio ainda estiver travado —
 * evita erro se algum som tentar tocar antes do primeiro clique do jogador.
 */
export function tocarEfeito(buffer, { volume = 1, variacaoPitch = 0 } = {}) {
  if (!buffer || !contexto || contexto.state !== 'running') return

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
  ganho.connect(volumeEfeitos)
  fonte.start()
}

/**
 * Música de fundo: toca `buffer` (carregado com carregarSom/carregarSomOpcional)
 * em loop contínuo. Chamar só uma vez — chamadas repetidas são ignoradas.
 * Se `buffer` for `null` (arquivo da trilha ainda não adicionado em
 * assets/sounds/), simplesmente não toca nada, sem erro.
 */
export function iniciarMusicaFundo(buffer) {
  if (musicaIniciada || !contexto || !buffer) return
  musicaIniciada = true

  const ganhoMusica = contexto.createGain()
  ganhoMusica.gain.value = 0.35
  ganhoMusica.connect(volumeMestre)

  const fonte = contexto.createBufferSource()
  fonte.buffer = buffer
  fonte.loop = true
  fonte.connect(ganhoMusica)
  fonte.start()
}