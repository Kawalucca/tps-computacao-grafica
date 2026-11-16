# Attack on Titan — Diorama 3D

Trabalho Prático 2 de Computação Gráfica: um diorama inspirado no confronto entre Levi Ackerman e Zeke Yeager, o Titã Bestial. É um projeto estudantil não oficial.

O projeto usa JavaScript, WebGL 2, shaders GLSL e TWGL.js para auxiliar as operações WebGL. A cena não utiliza THREE.js nem exige instalação de dependências para executar.

## Execução local


```bash
py -m http.server 8000
```

## Cena e controles

A cena inclui uma base circular com gramado e hemisfério inferior, árvores, muralha com portão, ruínas, destroços, vigas, bandeiras com as Asas da Liberdade, canhão articulado e os personagens. A iluminação usa componentes ambiente, difusa e especular; há texturas, céu, neblina, fumaça verde dos sinalizadores, pequenos jatos brancos no equipamento de Levi, som ambiente de vento sintetizado e música de fundo.

Há também referências à história pelo cenário: o diário de Grisha e a chave do porão dos Yeager perto de uma árvore, a batata de Sasha, uma garrafa de vinho e o lenço vermelho de Mikasa pendurado em um galho. Atrás da muralha, uma folha traz a palavra “TATAKAE”.

| Controle | Ação |
| --- | --- |
| `1` | Selecionar câmera automática |
| `2` | Selecionar câmera orbital |
| Arrastar com o botão esquerdo | Girar a câmera orbital |
| Roda do mouse | Aproximar ou afastar |
| `P` | Alternar entre três poses de Levi |
| `L` | Ligar ou desligar a luz |
| `N` | Ligar ou desligar a neblina |
| `M` | Ligar ou desligar a música e o som ambiente |
| `H` | Mostrar ou ocultar a ajuda |

O botão na página também liga ou desliga a música e o vento juntos. A música é reproduzida em repetição e retoma da posição em que foi pausada. O áudio depende de uma interação do usuário e da disponibilidade da Web Audio API no navegador.

## Opcionais implementados

- **Modelos tridimensionais**: uso de modelos GLB para os personagens.
- **Skybox, skyphere ou skydome**: céu procedural desenhado em uma esfera que acompanha a câmera.
- **Vento**: movimento das bandeiras produzido no shader.
- **Efeitos de partículas**: fumaça no cenário e nos propulsores.
- **Neblina**: pode ser ligada e desligada pela tecla `N`.
- **Música, efeitos sonoros e/ou som ambiente**: música de fundo e vento sintetizado, ativados pela tecla `M`.

## Modelos e limitações

Os arquivos `assets/models/levi.glb` e `assets/models/zeke.glb` são modelos demonstrativos originais, simplificados e estilizados. Não são modelos oficiais nem foram extraídos do anime. As poses de Levi são feitas por transformações do modelo inteiro, sem animação esquelética.

O carregador próprio implementa um subconjunto de glTF 2.0/GLB 2.0, incluindo hierarquia, malhas triangulares, normais, coordenadas UV e materiais básicos com cor e textura base. Ele não implementa skinning, animações esqueléticas, morph targets, compressão Draco/Meshopt ou o pipeline PBR completo. Modelos externos devem ser exportados como malhas estáticas compatíveis, e seus autores, fontes e licenças devem ser registrados. Consulte [a documentação dos modelos](assets/models/README.md).

## Recursos e créditos

- **Kauã Lucca Marques Souza Costa** — [GitHub](https://github.com/Kawalucca).
- **Hugo** — completar sobrenome e perfil GitHub antes da entrega.
- **TWGL.js 5.5.4**, de Gregg Tavares — biblioteca auxiliar WebGL, licença MIT: <https://github.com/greggman/twgl.js>.
- **Música**: “Guren no Yumiya” (Feuerroter Pfeil und Bogen), de Linked Horizon, primeira abertura de *Attack on Titan*. Arquivo fornecido para o projeto: `assets/audio/abertura.mp3`. Referências: [portal oficial de Attack on Titan](https://aot-portal.com/en/music/) e [vídeo da Crunchyroll](https://www.youtube.com/watch?v=8OkpRK2_gVs).
- O som ambiente é sintetizado pela aplicação. Os personagens podem ser gerados com `tools/gerar_personagens.py`, as texturas originais com `tools/gerar_recursos.py`, a do gramado com `tools/gerar_grama.py`, a do brasão com `tools/gerar_brasao.py` e a do bilhete com `tools/gerar_bilhete.py`; a aplicação pronta não precisa das bibliotecas Python usadas para geração.

As capturas para o Media Kit e os dados completos de autoria ainda precisam ser adicionados antes da entrega.
