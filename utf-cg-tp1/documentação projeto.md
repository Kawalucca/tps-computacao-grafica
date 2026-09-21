# Tower Defense Naval

Trabalho Prático 1 de Computação Gráfica (WebGL 2) — CEFET-MG.

<!-- Antes da entrega: preencher os links, os contatos, o media kit e os créditos,
     marcar [x] nos opcionais implementados e REMOVER os que ficaram de fora. -->

## O Jogo

Um *Tower Defense* naval. Um farol no centro do mar precisa resistir a ondas de
piratas e, depois que a noite cai, de monstros marinhos. O farol atira sozinho;
o jogador comanda um barco de patrulha com o mouse e enfrenta dois chefes:
o Holandês Voador e o Kraken.

**Jogar:** https://SEU-USUARIO.github.io/REPOSITORIO/

**Controles**

- Mover o mouse: o barco de patrulha segue o cursor e ataca sozinho os inimigos próximos.
- Clicar em um inimigo: causa dano a ele.

**Rodar localmente**

Módulos ES e o download de shaders não funcionam abrindo o `index.html`
direto do disco; é preciso um servidor local. Na pasta do projeto:

```bash
python -m http.server 8000
```

e abrir http://localhost:8000 (ou usar a extensão *Live Server* do VS Code).

## Criador(es)

- Hugo Daniel Amaral Oliveira — [contato: e-mail ou LinkedIn]
- Kawã Lucca Marques — [contato: e-mail ou LinkedIn]

## Media kit

<!-- 1 a 3 screenshots em assets/media/, por exemplo:
![Tela de jogo](assets/media/screenshot-1.png)
-->

## Opcionais

<!-- Texto dos itens copiado do enunciado, como pedido. -->

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

| Recurso | Autor | Link | Licença |
|---|---|---|---|
| [ex.: sprites de navios] | [autor] | [url] | [licença] |
