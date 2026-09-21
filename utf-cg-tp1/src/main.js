// FASE 0 — teste de fumaça (smoke test)
//
// Só confirma que a base funciona, localmente e no GitHub Pages:
//   1. o módulo ES foi carregado (<script type="module">)
//   2. o navegador oferece WebGL2
//   3. o canvas responde a comandos de desenho
//
// Na Fase 1, este arquivo vira o ponto de entrada do jogo: passa a montar o
// loop principal e a chamar os módulos de src/engine/.

const canvas = document.querySelector('#tela-webgl')
const hud = document.querySelector('#hud')
const gl = canvas.getContext('webgl2')

if (!gl) {
  hud.classList.add('erro')
  hud.textContent =
    'Este navegador não oferece WebGL 2. Atualize o navegador ou tente outro.'
  throw new Error('WebGL2 não suportado')
}

// pinta o canvas de azul-mar: se você vê esta cor, está tudo funcionando
gl.clearColor(0.09, 0.36, 0.52, 1)
gl.clear(gl.COLOR_BUFFER_BIT)

console.log('WebGL2 ok:', gl.getParameter(gl.VERSION))
