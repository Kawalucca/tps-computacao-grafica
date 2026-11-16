# Modelos GLB — Levi e Zeke

Os arquivos `levi.glb` e `zeke.glb` deste pacote são **modelos estilizados originais**, gerados por `tools/gerar_personagens.py` com malhas triangulares e normais suavizadas. Para regenerá-los, execute `py tools/gerar_personagens.py` a partir da pasta do TP2; o script usa apenas a biblioteca padrão do Python.

Eles não são modelos oficiais de *Attack on Titan*, não foram retirados do anime e não foram obtidos de terceiros. Representam, de forma estilizada, a composição proposta e permitem testar o carregador GLB do projeto sem baixar ativos externos.

## Substituir por modelos mais detalhados

1. Coloque os novos modelos como `assets/models/levi.glb` e `assets/models/zeke.glb`.
2. Use glTF 2.0/GLB 2.0 sem compressão Draco ou Meshopt.
3. Prefira malhas triangulares estáticas, normais e texturas baseColor.
4. Se os modelos vierem com animações esqueléticas, esta versão **não executa skinning**; exporte-os na pose desejada.
5. Confira posicionamento, escala e orientação na aplicação; as transformações estão em `src/scene/levi.js` e `zeke.js`.
6. Atualize os créditos do README principal com autor, fonte, licença e alterações realizadas.

**Carregador**: implementa um subconjunto de glTF 2.0 (geometria, nós, normais, UV, texturas baseColor e cores). Não é um renderizador PBR completo.
