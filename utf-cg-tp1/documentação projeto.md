# The Last Beacon: Tower Defense Naval

Trabalho Prático 1 de Computação Gráfica (WebGL 2) — CEFET-MG.

<!-- Antes da entrega NÃO ESQUECER: preencher os links, os contatos, o media kit e os créditos,
     marcar [x] nos opcionais implementados e REMOVER os que ficaram de fora. -->

## Sobre o desenvolvimento
Professor, você com certeza irá perceber a concentração absurda de commits feitas no dia de hoje (21/09) kkkkkkkkkkkkk
Basicamente eu e o Kakaw focamos em fazer todo o MVP (com os requisitos obrigatórios) do jogo antes de dar o primeiro commit oficial -- facilitou MUITO nossa organização e mamanteve o projeto limpo.
Hoje, depois de uma viagem que ele fez no final de semana, nos reunimos pra organizar TODOS os commits e subir pro repositório TUDO que fizemos até agora, mas em partes estratégicas -- o objetivo foi contar a história de evolução que tivemos seguindo o planejamento de 7 fases que elaboramos e estamos seguindo :D

## O Jogo

Um *Tower Defense* naval. Um farol no centro do mar precisa resistir a ondas de
piratas e, depois que a noite cai, um navio lendario fantasma. O farol atira sozinho;
o jogador comanda um barco de patrulha com o mouse e enfrenta os inimigos.

**Jogar:** https://kawalucca.github.io/tps-computacao-grafica/utf-cg-tp1/

**Controles**

- Mover o mouse: o barco de patrulha segue o cursor e ataca automaticamente os inimigos próximos.

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

## Opcionais

### Relativas à apresentação do jogo e gráficos

- [ ] ⭐ **Texturas animadas**: você pode criar animações de personagens ou cenário. Por exemplo, para inimigo andando, atacando... uma explosão, para os projéteis etc
- [ ] 💣 **Efeitos de partículas** para simular explosão, faíscas etc
- [ ] ⭐ **Telas**: faça um jogo completo, ou seja, implemente telas de _splash screen_, menu inicial, créditos, opções, _game over_, etc
- [ ] 🌟 **Sons**: Colocar efeitos sonoros e música de fundo no seu jogo

### Relativas aos inimigos

- [ ] ⭐ **Inimigos diferentes**: faça inimigos visual e mecanicamente diferentes, como com velocidades distintas, frequência de ataque, dano etc
  - *No jogo:* piratas nas waves 1–3 e monstros marinhos (serpentes, sereianos, peixes mais brutos) nas waves 4–6.
- [ ] **Inimigos em ondas**: crie o conceito de ondas de inimigos (fases) para que o jogador possa conciliar momentos de maior tensão ou maior relaxamento (no intervalinho entre ondas). As ondas podem ser "fases curadas" e finitas, ou infinitas (com aumento de dificuldade)
  - *No jogo:* 6 waves finitas com dificuldade crescente, com chefe ao final da 3ª e da 6ª.
- [ ] 🍔 **Caminhos dos inimigos**: em vez de sempre vir de fora da tela para o centro, crie um caminho (sequência de _waypoints_) que os inimigos percorrem até chegar à torre principal (como a maioria dos _tower defense_ fazem)
  - *No jogo:* o Holandês Voador percorre um caminho ao redor do farol, sinalizado por uma trilha vermelha.

### Relativas aos recursos do jogador

- [ ] 🍔 **Herói**: além da(s) torre(s), o jogador poderá controlar (mouse? teclado?) um pequeno personagem que anda pelo cenário e ataca os inimigos próximos de forma automática (como se fosse uma torre móvel)
  - *No jogo:* o barco de patrulha, controlado pelo mouse.

### Implementação criativa

- [ ] **Implementação criativa**: qualquer implementação que não fuja muito do pedido, mas que traga elementos novos e interessantes para o seu jogo é bem-vinda!
  - *No jogo:* dois confrontos de chefe com mecânicas diferentes: o Holandês Voador (wave 3) e o Kraken (wave 6).

## Créditos

<!-- dificlmente vamos deixar essa parte em branco -- principalmente na parte da estilização final -->

| Recurso | Autor | Link | Licença |
|---|---|---|---|
| [ex.: sprites de navios] | [autor] | [url] | [licença] |
