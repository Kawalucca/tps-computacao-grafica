# The Last Beacon: Tower Defense Naval

Trabalho Prático 1 de Computação Gráfica (WebGL 2) — CEFET-MG.

<!-- Antes da entrega NÃO ESQUECER: preencher os links, os contatos, o media kit e os créditos,
     marcar [x] nos opcionais implementados e REMOVER os que ficaram de fora. -->

## Sobre o desenvolvimento
Professor, você com certeza irá perceber a concentração absurda de commits feitas no dia de hoje (21/09) kkkkkkkkkkkkk
Basicamente eu e o Kakaw focamos em fazer todo o MVP (com os requisitos obrigatórios) do jogo antes de dar o primeiro commit oficial -- facilitou MUITO nossa organização e mamanteve o projeto limpo.
Hoje, depois de uma viagem que ele fez no final de semana, nos reunimos pra organizar TODOS os commits e subir pro repositório TUDO que fizemos até agora, mas em partes estratégicas -- o objetivo foi contar a história de evolução que tivemos seguindo o planejamento de 7 fases que elaboramos e estamos seguindo :D

## Linha do tempo de desenvolvimento

Reconstruída a partir dos próprios comentários que fomos deixando no código (`// Fase 3`, `// Fase 5`, `// Fase 6`...) e do histórico de commits — não é um resumo bonito escrito depois, é literalmente o que cada fase entregou:

1. **Fase 1 — Motor gráfico** (21/09): contexto WebGL2, shaders `.glsl` carregados de arquivo, loop principal com `dt` em segundos, mundo fixo 16:9 com projeção ortográfica, renderizador de sprites (textura + blend + matriz de modelo).
2. **Fase 2 — Cenário estático e entrada** (21/09): mar, ilha, farol (com o feixe girando) e barco desenhados na tela, captura do mouse já convertida para coordenadas do mundo.
3. **Fase 3 — MVP jogável** (22/09): entidade base (vida/dano/colisão círculo x círculo), inimigo nascendo fora da tela e andando até o farol, projétil genérico, pool de objetos sem realocar array, ataque compartilhado farol/barco mirando o mais próximo, dedada por clique, HUD e game over/reinício.
4. **Fase 4 — Waves, tipos de inimigo e som** (22/09): 3 tipos de pirata (batedor/padrão/brutamontes), sistema de ondas com descanso entre elas, efeitos sonoros e música de fundo.
5. **Fase 5 — Chefe** (25/09): Holandês Voador, com caminho próprio em espiral ao redor da ilha e ataque que atordoa o barco.
6. **Fase 6 — Iluminação noturna**: virada de dia para noite ao aparecer o chefe (mar e ilha escurecem, feixe do farol reforçado).
7. **Fase 7 — Polimento final**: identidade visual das telas (menu, fim de jogo, HUD) sobre arte própria, sons trocados para `.mp3` com trilha em loop, projéteis com spritesheet próprio e animação de disparo/voo/impacto, barco virando na direção do movimento, inimigos parando na costa da ilha (não sobem mais nas rochas), pausa (Esc/P) e rebalanceamento do chefe.

## O Jogo

Um *Tower Defense* naval. Um farol no centro do mar precisa resistir a ondas de
piratas e, depois que a noite cai, um navio lendário fantasma. O farol atira sozinho;
o jogador comanda um barco de patrulha com o mouse e enfrenta os inimigos.

**Jogar:** https://kawalucca.github.io/tps-computacao-grafica/utf-cg-tp1/

### Como jogar

- **Mover o mouse**: o barco de patrulha segue o cursor (com suavização, não é instantâneo) e ataca automaticamente o inimigo mais próximo dentro do alcance. Ele também vira visualmente para o lado pra onde está indo.
- **Clique esquerdo num inimigo**: "dedada" — causa dano direto na hora, além do que farol e barco já causam sozinhos.
- **Esc ou P**, ou o botão no canto inferior direito do HUD: pausa e retoma a partida.
- A aba precisa estar em foco: se você trocar de aba no meio da partida, o jogo pausa sozinho.

**Rodar localmente**

Módulos ES e o download de shaders não funcionam abrindo o `index.html`
direto do disco; é preciso um servidor local. Na pasta do projeto:

```bash
python -m http.server 8000
```

e abrir http://localhost:8000 (ou usar a extensão *Live Server* do VS Code).
O GitHub Pages faz isso de forma automática e "hospeda" nosso game (tela única) nos servidores deles.

## Criador(es)

- Hugo Daniel Amaral Oliveira — [e-mail: college.hugodaniel@gmail.com]
- Kawã Lucca Marques Souza — [email: kawa_lucca@yahoo.com.br]

## Media kit

<!-- 1 a 3 screenshots em assets/media/, por exemplo:
![Tela de jogo](assets/media/screenshot-1.png)

apenas pós finalização de TUDO
-->

## Arquitetura técnica

Só pra deixar registrado como o projeto está organizado, já que isso também é parte do que estudamos na disciplina:

- **`src/engine/`**: tudo genérico e reaproveitável (não sabe nada sobre farol, pirata ou boss) — contexto WebGL, matrizes, renderizador de sprites, pool de objetos de capacidade fixa (sem `push`/`splice` a cada inimigo que nasce ou morre), carregamento de textura e áudio.
- **`src/game/`**: as regras do nosso jogo em cima do motor — entidades, farol, barco, inimigos, chefe, projéteis, ondas.
- **Sprite sheet único de projéteis**: as 4 categorias de tiro (farol, barco, inimigos, Holandês) e os 3 estados de cada uma (disparo/voo/impacto) vêm de UMA imagem só, recortada por coordenada de textura (UV) — sem trocar de arquivo de textura a cada tiro, que é caro.
- **Mistura aditiva** (`gl.blendFunc(SRC_ALPHA, ONE)`) no feixe do farol à noite e na aura do barco atordoado: em vez de só transparência, a cor soma com o que já está desenhado — é o mesmo princípio de "luz somando luz" que dá o brilho de verdade no escuro.
- Todas as posições/tamanhos de jogo são em **unidades do mundo** (1280×720 fixos), não em pixels de tela — o `viewport`/`devicePixelRatio` cuidam de mapear isso pra qualquer tamanho de janela mantendo 16:9.

## Opcionais

### Como ficou implementado de fato

Checklist real, conferido direto no código (não no que planejamos no início — isso está na seção seguinte):

#### Apresentação do jogo e gráficos

- [x] ⭐ **Texturas animadas**: projéteis com 3 estados (disparo → voo → impacto, com escala e opacidade interpoladas, não é só trocar de quadro seco); inimigos "piscam" branco ao levar dano; barco com aura pulsante quando atordoado pelo chefe; feixe do farol intensifica à noite.
- [ ] 💣 **Efeitos de partículas**: não implementamos um sistema de partículas de verdade (spawn/simulação de várias partículas individuais) — o que existe é o quadro de "explosão" do próprio spritesheet do projétil, que é uma imagem só, não partículas simuladas.
- [x] ⭐ **Telas**: menu inicial e tela de fim de jogo com arte própria (fundo pintado + zonas clicáveis posicionadas em cima dela), HUD com vida/pontuação/onda, tela de pausa.
- [x] 🌟 **Sons**: efeitos sonoros (tiro, impacto, morte) e trilha sonora em loop, com volumes balanceados entre si.

#### Inimigos

- [x] ⭐ **Inimigos diferentes**: 3 tipos de navio pirata com velocidade/dano/vida/tamanho diferentes (batedor rápido e frágil, padrão equilibrado, brutamontes lento e resistente) + o chefe, com mecânica própria (caminho em espiral + ataque que atordoa em vez de só causar dano).
- [x] **Inimigos em ondas**: **3 waves finitas** com dificuldade crescente (mais inimigos e tipos mais fortes a cada uma), descanso entre elas, terminando num chefe único — o Holandês Voador. *(Não são as 6 waves com 2 chefes que planejamos originalmente — ver seção abaixo.)*
- [x] 🍔 **Caminhos dos inimigos**: o Holandês Voador não vem direto de fora da tela — percorre um caminho em espiral ao redor da ilha (sinalizado por uma trilha vermelha) até chegar na costa. Os piratas comuns continuam vindo direto de fora da tela até a costa (não têm waypoints próprios).

#### Recursos do jogador

- [x] 🍔 **Herói**: o barco de patrulha, controlado pelo mouse, ataca sozinho os inimigos próximos.

#### Implementação criativa

- [x] **Implementação criativa**:
  - Ciclo dia/noite: o cenário (mar, ilha, luz do farol) escurece quando o chefe aparece, com o feixe do farol ficando proporcionalmente mais forte no escuro (mistura aditiva).
  - Telas de menu/fim de jogo construídas sobre arte pintada própria, com as zonas clicáveis medidas por análise de pixel da própria imagem (não coordenadas "no olho").
  - Chefe com mecânica própria: em vez de só causar dano por contato como os piratas comuns, atira um projétil teleguiado que atordoa o barco por um tempo, forçando o jogador a se reposicionar em vez de só ficar parado atirando.

### Planejamento original (visão inicial do projeto)

Isto é o texto original que escrevemos no começo do projeto, antes de sabermos exatamente até onde o tempo ia deixar chegar. Mantemos aqui de propósito, sem editar — mostra o que a gente mirou, mesmo sem ter fechado tudo:

- [ ] ⭐ **Texturas animadas**: você pode criar animações de personagens ou cenário. Por exemplo, para inimigo andando, atacando... uma explosão, para os projéteis etc
- [ ] 💣 **Efeitos de partículas** para simular explosão, faíscas etc
- [ ] ⭐ **Telas**: faça um jogo completo, ou seja, implemente telas de _splash screen_, menu inicial, créditos, opções, _game over_, etc
- [ ] 🌟 **Sons**: Colocar efeitos sonoros e música de fundo no seu jogo
- [ ] ⭐ **Inimigos diferentes**: faça inimigos visual e mecanicamente diferentes, como com velocidades distintas, frequência de ataque, dano etc
  - *No jogo:* piratas nas waves 1–3 e monstros marinhos (serpentes, sereianos, peixes mais brutos) nas waves 4–6.
- [ ] **Inimigos em ondas**: crie o conceito de ondas de inimigos (fases) para que o jogador possa conciliar momentos de maior tensão ou maior relaxamento (no intervalinho entre ondas). As ondas podem ser "fases curadas" e finitas, ou infinitas (com aumento de dificuldade)
  - *No jogo:* 6 waves finitas com dificuldade crescente, com chefe ao final da 3ª e da 6ª.
- [ ] 🍔 **Caminhos dos inimigos**: em vez de sempre vir de fora da tela para o centro, crie um caminho (sequência de _waypoints_) que os inimigos percorrem até chegar à torre principal (como a maioria dos _tower defense_ fazem)
  - *No jogo:* o Holandês Voador percorre um caminho ao redor do farol, sinalizado por uma trilha vermelha.
- [ ] 🍔 **Herói**: além da(s) torre(s), o jogador poderá controlar (mouse? teclado?) um pequeno personagem que anda pelo cenário e ataca os inimigos próximos de forma automática (como se fosse uma torre móvel)
  - *No jogo:* o barco de patrulha, controlado pelo mouse.
- [ ] **Implementação criativa**: qualquer implementação que não fuja muito do pedido, mas que traga elementos novos e interessantes para o seu jogo é bem-vinda!
  - *No jogo:* dois confrontos de chefe com mecânicas diferentes: o Holandês Voador (wave 3) e o Kraken (wave 6).

O Kraken e as waves 4–6 (com os "monstros marinhos") acabaram não saindo do papel — o tempo que sobrou foi pra polir o que já tínhamos (telas, som, animação, balanceamento) em vez de esticar o escopo. A checklist real está na seção anterior.

## Créditos

<!-- dificlmente vamos deixar essa parte em branco -- principalmente na parte da estilização final -->
Só usamos recursos sem copyright ou assets gerados por IA (imagens e trilha sonora)

<!-- TODO: preencher com a ferramenta de IA usada pra gerar as artes (farol, navios,
     telas de menu/fim de jogo, spritesheet de projéteis, ilha noturna) e os sons/trilha -->

| Recurso | Autor | Link | Licença |
|---|---|---|---|
| [ex.: sprites de navios] | [autor] | [url] | [licença] |
