# Attack on Titan — Diorama 3D

Trabalho Prático 2 de Computação Gráfica.

Projeto desenvolvido em JavaScript, WebGL 2, GLSL e TWGL.js. A proposta é construir um diorama tridimensional semirrealista inspirado em *Shingeki no Kyojin (Attack on Titan)*, representando o confronto entre Levi Ackerman e Zeke Yeager em sua forma de Titã Bestial.

O projeto não utiliza THREE.js. A renderização é realizada diretamente com WebGL 2, com apoio da biblioteca TWGL.js.

## 1. A Cena

A composição planejada apresenta Zeke à esquerda e Levi à direita, com a espada de Levi direcionada à região da boca do Titã Bestial. O cenário contém base circular, hemisfério inferior, ruínas, destroços, vigas e um canhão com parte móvel.

### Implementado nas etapas incluídas neste pacote

**Etapa 1 — Mundo e geometria inicial**
- Disco circular no plano XZ.
- Hemisfério inferior da base.
- Ruínas de pedra, destroços e vigas.
- Canhão hierárquico com base fixa e tubo articulado.
- Câmera inicial com projeção perspectiva.

**Etapa 2 — Personagens e carregamento glTF/GLB**
- Carregador próprio para um subconjunto do glTF 2.0 e GLB 2.0.
- Leitura de buffers externos e do chunk BIN do GLB.
- Leitura de hierarquia de nós e transformações.
- Primitivas triangulares, posições, coordenadas UV e índices.
- Suporte básico a `baseColorFactor` e `baseColorTexture`.
- Estados de posição e orientação de Levi.
- Alternância entre três poses pela tecla `P`.
- Espada construída com sólidos do projeto.
- Geometrias provisórias de Levi e Zeke enquanto os modelos reais não são adicionados.

### Controles atuais

- `P`: alterna entre as três posições/orientações configuradas para Levi.

## 2. Criadores

- **Kauã Lucca Marques Souza Costa** — [GitHub](https://github.com/Kawalucca)
- **Hugo** — completar sobrenome e perfil GitHub antes da entrega.

## 3. Media Kit

As capturas de tela serão incluídas após a execução e os ajustes visuais da cena.

- `assets/screenshots/`: pasta reservada para capturas do projeto.

## 4. Opcionais e etapas futuras

O planejamento geral do projeto foi dividido em **cinco etapas**. Este pacote reúne o código integrado das duas primeiras.

**Etapa 3 — Câmeras e efeitos visuais**
- Segunda câmera orbital controlada pelo mouse.
- Câmera automática e controle de zoom.
- Skybox, skysphere ou skydome.
- Partículas de fumaça e poeira.
- Neblina com controle pelo teclado.

**Etapa 4 — Iluminação, materiais e texturas**
- Modelo de iluminação Phong.
- Luz direcional e, se necessário, luzes pontuais.
- Materiais dos personagens e objetos.
- Texturas para terreno, pedra, madeira e metal.
- Controles de iluminação previstos no enunciado.

**Etapa 5 — Integração e finalização**
- Áudio ambiente, música ou efeitos sonoros.
- Ajustes de escala, enquadramento e composição.
- Capturas de tela e atualização do Media Kit.
- Créditos e licenças de todos os recursos externos.
- Testes finais e publicação.

Os itens das etapas futuras estão planejados, não concluídos. Os modelos definitivos de Levi e Zeke também ainda precisam ser adicionados.

## 5. Créditos

- **TWGL.js 5.5.4** — Gregg Tavares. Biblioteca auxiliar para operações WebGL, sob licença MIT: https://github.com/greggman/twgl.js
- **Modelos de Levi e Zeke:** ainda não incluídos. Registrar autor, URL de origem e licença quando forem selecionados.
- **Texturas, imagens e áudio:** registrar as respectivas fontes e licenças quando forem incorporados.

## Execução local

O projeto utiliza módulos ES e carrega shaders e modelos por `fetch`. Execute o servidor HTTP a partir da raiz do repositório:

```bash
py -m http.server 8000
```

Abra no navegador:

```text
http://localhost:8000/utf-cg-tp2/
```

## Limitações conhecidas do carregador glTF/GLB

O carregador implementa um subconjunto do glTF 2.0. Nesta versão, ainda não oferece:
- skinning e animações esqueléticas;
- morph targets;
- compressão Draco/Meshopt;
- implementação completa do pipeline PBR;
- todos os modos de transparência e extensões do padrão.

Modelos rigados podem ser carregados apenas como malhas estáticas, sem deformação esquelética. A alternância das três poses de Levi nesta etapa é realizada pela transformação do modelo inteiro.
